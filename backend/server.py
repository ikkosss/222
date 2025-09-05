from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
import uuid
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Phone number normalization function
def normalize_phone_number(phone: str) -> str:
    """
    Normalize Russian phone numbers to +7 999 888 77 66 format
    Supports formats like:
    - +79651091162
    - 89651091162  
    - 9651091162
    - +7 (965) 109-11-62
    - (965)1091162
    """
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Handle different input formats
    if digits.startswith('8') and len(digits) == 11:
        # 89651091162 -> 9651091162
        digits = digits[1:]
    elif digits.startswith('7') and len(digits) == 11:
        # 79651091162 -> 9651091162  
        digits = digits[1:]
    
    # Should now have 10 digits starting with 9
    if len(digits) != 10 or not digits.startswith('9'):
        raise ValueError(f"Invalid Russian phone number format: {phone}")
    
    # Format as +7 999 888 77 66
    return f"+7 {digits[:3]} {digits[3:6]} {digits[6:8]} {digits[8:10]}"

# Pydantic models
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class Operator(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    logo_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class OperatorCreate(BaseModel):
    name: str
    logo_base64: Optional[str] = None

class Service(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    logo_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ServiceCreate(BaseModel):
    name: str
    logo_base64: Optional[str] = None

class Phone(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    number: str  # Normalized format +7 999 888 77 66
    operator_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('number')
    def validate_number(cls, v):
        return normalize_phone_number(v)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PhoneCreate(BaseModel):
    number: str
    operator_id: str

    @validator('number')
    def validate_number(cls, v):
        return normalize_phone_number(v)

class Usage(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    phone_id: str
    service_id: str
    used_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UsageCreate(BaseModel):
    phone_id: str
    service_id: str

# Search response models
class SearchResult(BaseModel):
    type: str  # "phone" or "service"
    id: str
    display_text: str
    
# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "UPN API - Russian Phone Number Tracker"}

# Phone number normalization endpoint
@api_router.post("/normalize-phone")
async def normalize_phone_endpoint(phone: str):
    try:
        normalized = normalize_phone_number(phone)
        return {"original": phone, "normalized": normalized}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Operator endpoints
@api_router.post("/operators", response_model=Operator)
async def create_operator(operator: OperatorCreate):
    operator_dict = operator.dict()
    result = await db.operators.insert_one(operator_dict)
    created_operator = await db.operators.find_one({"_id": result.inserted_id})
    return Operator(**created_operator)

@api_router.get("/operators", response_model=List[Operator])
async def get_operators():
    operators = await db.operators.find().to_list(1000)
    return [Operator(**op) for op in operators]

@api_router.get("/operators/{operator_id}", response_model=Operator)
async def get_operator(operator_id: str):
    if not ObjectId.is_valid(operator_id):
        raise HTTPException(status_code=400, detail="Invalid operator ID")
    operator = await db.operators.find_one({"_id": ObjectId(operator_id)})
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    return Operator(**operator)

@api_router.put("/operators/{operator_id}", response_model=Operator)
async def update_operator(operator_id: str, operator: OperatorCreate):
    if not ObjectId.is_valid(operator_id):
        raise HTTPException(status_code=400, detail="Invalid operator ID")
    
    update_data = operator.dict()
    result = await db.operators.update_one(
        {"_id": ObjectId(operator_id)}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    updated_operator = await db.operators.find_one({"_id": ObjectId(operator_id)})
    return Operator(**updated_operator)

@api_router.delete("/operators/{operator_id}")
async def delete_operator(operator_id: str):
    if not ObjectId.is_valid(operator_id):
        raise HTTPException(status_code=400, detail="Invalid operator ID")
    
    result = await db.operators.delete_one({"_id": ObjectId(operator_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    return {"message": "Operator deleted successfully"}

# Service endpoints
@api_router.post("/services", response_model=Service)
async def create_service(service: ServiceCreate):
    service_dict = service.dict()
    result = await db.services.insert_one(service_dict)
    created_service = await db.services.find_one({"_id": result.inserted_id})
    return Service(**created_service)

@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find().to_list(1000)
    return [Service(**svc) for svc in services]

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service: ServiceCreate):
    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")
    
    update_data = service.dict()
    result = await db.services.update_one(
        {"_id": ObjectId(service_id)}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    updated_service = await db.services.find_one({"_id": ObjectId(service_id)})
    return Service(**updated_service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")
    
    result = await db.services.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully"}

# Phone endpoints  
@api_router.post("/phones", response_model=Phone)
async def create_phone(phone: PhoneCreate):
    # Check if operator exists
    if not ObjectId.is_valid(phone.operator_id):
        raise HTTPException(status_code=400, detail="Invalid operator ID")
    
    operator = await db.operators.find_one({"_id": ObjectId(phone.operator_id)})
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    # Check if phone already exists
    existing_phone = await db.phones.find_one({"number": phone.number})
    if existing_phone:
        raise HTTPException(status_code=409, detail="Phone number already exists")
    
    phone_dict = phone.dict()
    result = await db.phones.insert_one(phone_dict)
    created_phone = await db.phones.find_one({"_id": result.inserted_id})
    return Phone(**created_phone)

@api_router.get("/phones", response_model=List[Phone])
async def get_phones():
    phones = await db.phones.find().to_list(1000)
    return [Phone(**phone) for phone in phones]

@api_router.get("/phones/{phone_id}", response_model=Phone)
async def get_phone(phone_id: str):
    if not ObjectId.is_valid(phone_id):
        raise HTTPException(status_code=400, detail="Invalid phone ID")
    phone = await db.phones.find_one({"_id": ObjectId(phone_id)})
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    return Phone(**phone)

@api_router.put("/phones/{phone_id}", response_model=Phone)
async def update_phone(phone_id: str, phone: PhoneCreate):
    if not ObjectId.is_valid(phone_id):
        raise HTTPException(status_code=400, detail="Invalid phone ID")
    
    # Check if operator exists
    if not ObjectId.is_valid(phone.operator_id):
        raise HTTPException(status_code=400, detail="Invalid operator ID")
    
    operator = await db.operators.find_one({"_id": ObjectId(phone.operator_id)})
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    update_data = phone.dict()
    result = await db.phones.update_one(
        {"_id": ObjectId(phone_id)}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Phone not found")
    
    updated_phone = await db.phones.find_one({"_id": ObjectId(phone_id)})
    return Phone(**updated_phone)

@api_router.delete("/phones/{phone_id}")
async def delete_phone(phone_id: str):
    if not ObjectId.is_valid(phone_id):
        raise HTTPException(status_code=400, detail="Invalid phone ID")
    
    result = await db.phones.delete_one({"_id": ObjectId(phone_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Phone not found")
    
    return {"message": "Phone deleted successfully"}

# Usage tracking endpoints
@api_router.post("/usage", response_model=Usage)
async def create_usage(usage: UsageCreate):
    # Validate phone and service exist
    if not ObjectId.is_valid(usage.phone_id):
        raise HTTPException(status_code=400, detail="Invalid phone ID")
    if not ObjectId.is_valid(usage.service_id):
        raise HTTPException(status_code=400, detail="Invalid service ID")
    
    phone = await db.phones.find_one({"_id": ObjectId(usage.phone_id)})
    service = await db.services.find_one({"_id": ObjectId(usage.service_id)})
    
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if usage already exists
    existing_usage = await db.usage.find_one({
        "phone_id": usage.phone_id,
        "service_id": usage.service_id
    })
    if existing_usage:
        raise HTTPException(status_code=409, detail="Usage already recorded")
    
    usage_dict = usage.dict()
    result = await db.usage.insert_one(usage_dict)
    created_usage = await db.usage.find_one({"_id": result.inserted_id})
    return Usage(**created_usage)

@api_router.get("/usage", response_model=List[Usage])
async def get_usage():
    usage_records = await db.usage.find().to_list(1000)
    return [Usage(**usage) for usage in usage_records]

@api_router.delete("/usage/{usage_id}")
async def delete_usage(usage_id: str):
    if not ObjectId.is_valid(usage_id):
        raise HTTPException(status_code=400, detail="Invalid usage ID")
    
    result = await db.usage.delete_one({"_id": ObjectId(usage_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usage record not found")
    
    return {"message": "Usage record deleted successfully"}

# Search endpoint
@api_router.get("/search", response_model=List[SearchResult])
async def search(q: str = Query(..., min_length=1)):
    results = []
    
    # Search phones by normalized number
    try:
        normalized_query = normalize_phone_number(q)
        phones = await db.phones.find({"number": {"$regex": normalized_query, "$options": "i"}}).to_list(10)
        for phone in phones:
            results.append(SearchResult(
                type="phone",
                id=str(phone["_id"]),
                display_text=phone["number"]
            ))
    except ValueError:
        # Not a valid phone number, search phones by partial match
        phones = await db.phones.find({"number": {"$regex": q, "$options": "i"}}).to_list(10)
        for phone in phones:
            results.append(SearchResult(
                type="phone", 
                id=str(phone["_id"]),
                display_text=phone["number"]
            ))
    
    # Search services by name
    services = await db.services.find({"name": {"$regex": q, "$options": "i"}}).to_list(10)
    for service in services:
        results.append(SearchResult(
            type="service",
            id=str(service["_id"]),
            display_text=service["name"]
        ))
    
    return results

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()