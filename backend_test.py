#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for UPN (Russian Phone Number Tracker)
Tests phone normalization, CRUD operations, usage tracking, and search functionality.
"""

import requests
import json
import base64
from typing import Dict, List, Optional
import sys
import os

# Get backend URL from environment
BACKEND_URL = "https://bonus-checker.preview.emergentagent.com/api"

class UPNAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.created_ids = {
            'operators': [],
            'services': [],
            'phones': [],
            'usage': []
        }
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with level"""
        print(f"[{level}] {message}")
        
    def test_connection(self) -> bool:
        """Test basic API connection"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                self.log("✅ API connection successful")
                self.log(f"Response: {response.json()}")
                return True
            else:
                self.log(f"❌ API connection failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ API connection error: {str(e)}", "ERROR")
            return False
    
    def test_phone_normalization(self) -> bool:
        """Test phone number normalization with various Russian formats"""
        self.log("\n=== Testing Phone Number Normalization ===")
        
        test_cases = [
            # Format: (input, expected_output)
            ("+79651091162", "+7 965 109 11 62"),
            ("89651091162", "+7 965 109 11 62"),
            ("9651091162", "+7 965 109 11 62"),
            ("+7 (965) 109-11-62", "+7 965 109 11 62"),
            ("(965)1091162", "+7 965 109 11 62"),
            ("+7-965-109-11-62", "+7 965 109 11 62"),
            ("8 965 109 11 62", "+7 965 109 11 62")
        ]
        
        all_passed = True
        
        for input_phone, expected in test_cases:
            try:
                # Test normalization endpoint
                response = self.session.post(
                    f"{self.base_url}/normalize-phone",
                    params={"phone": input_phone}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    normalized = result.get("normalized")
                    
                    if normalized == expected:
                        self.log(f"✅ {input_phone} -> {normalized}")
                    else:
                        self.log(f"❌ {input_phone} -> {normalized} (expected: {expected})", "ERROR")
                        all_passed = False
                else:
                    self.log(f"❌ Failed to normalize {input_phone}: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Error normalizing {input_phone}: {str(e)}", "ERROR")
                all_passed = False
        
        # Test invalid phone numbers
        invalid_cases = ["123", "abc", "+1234567890", ""]
        
        for invalid_phone in invalid_cases:
            try:
                response = self.session.post(
                    f"{self.base_url}/normalize-phone",
                    params={"phone": invalid_phone}
                )
                
                if response.status_code == 400:
                    self.log(f"✅ Correctly rejected invalid phone: {invalid_phone}")
                else:
                    self.log(f"❌ Should have rejected invalid phone {invalid_phone}: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Error testing invalid phone {invalid_phone}: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_operators_crud(self) -> bool:
        """Test CRUD operations for operators"""
        self.log("\n=== Testing Operators CRUD ===")
        
        all_passed = True
        
        # Create sample base64 logo (small PNG)
        sample_logo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        # Test CREATE operator
        try:
            operator_data = {
                "name": "МТС",
                "logo_base64": sample_logo
            }
            
            response = self.session.post(
                f"{self.base_url}/operators",
                json=operator_data
            )
            
            if response.status_code == 200:
                operator = response.json()
                operator_id = operator["_id"]  # Use _id instead of id
                self.created_ids['operators'].append(operator_id)
                self.log(f"✅ Created operator: {operator['name']} (ID: {operator_id})")
            else:
                self.log(f"❌ Failed to create operator: {response.status_code} - {response.text}", "ERROR")
                all_passed = False
                return all_passed
                
        except Exception as e:
            self.log(f"❌ Error creating operator: {str(e)}", "ERROR")
            all_passed = False
            return all_passed
        
        # Test GET all operators
        try:
            response = self.session.get(f"{self.base_url}/operators")
            
            if response.status_code == 200:
                operators = response.json()
                self.log(f"✅ Retrieved {len(operators)} operators")
                
                if len(operators) > 0 and operators[0]["name"] == "МТС":
                    self.log("✅ Operator data matches")
                else:
                    self.log("❌ Operator data mismatch", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to get operators: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error getting operators: {str(e)}", "ERROR")
            all_passed = False
        
        # Test GET single operator
        try:
            response = self.session.get(f"{self.base_url}/operators/{operator_id}")
            
            if response.status_code == 200:
                operator = response.json()
                self.log(f"✅ Retrieved single operator: {operator['name']}")
            else:
                self.log(f"❌ Failed to get single operator: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error getting single operator: {str(e)}", "ERROR")
            all_passed = False
        
        # Test UPDATE operator
        try:
            update_data = {
                "name": "МТС Обновленный",
                "logo_base64": sample_logo
            }
            
            response = self.session.put(
                f"{self.base_url}/operators/{operator_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                updated_operator = response.json()
                if updated_operator["name"] == "МТС Обновленный":
                    self.log("✅ Updated operator successfully")
                else:
                    self.log("❌ Operator update data mismatch", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to update operator: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error updating operator: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_services_crud(self) -> bool:
        """Test CRUD operations for services"""
        self.log("\n=== Testing Services CRUD ===")
        
        all_passed = True
        
        # Create sample base64 logo
        sample_logo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        # Test CREATE service
        try:
            service_data = {
                "name": "Яндекс.Такси",
                "logo_base64": sample_logo
            }
            
            response = self.session.post(
                f"{self.base_url}/services",
                json=service_data
            )
            
            if response.status_code == 200:
                service = response.json()
                service_id = service["_id"]  # Use _id instead of id
                self.created_ids['services'].append(service_id)
                self.log(f"✅ Created service: {service['name']} (ID: {service_id})")
            else:
                self.log(f"❌ Failed to create service: {response.status_code} - {response.text}", "ERROR")
                all_passed = False
                return all_passed
                
        except Exception as e:
            self.log(f"❌ Error creating service: {str(e)}", "ERROR")
            all_passed = False
            return all_passed
        
        # Test GET all services
        try:
            response = self.session.get(f"{self.base_url}/services")
            
            if response.status_code == 200:
                services = response.json()
                self.log(f"✅ Retrieved {len(services)} services")
                
                if len(services) > 0 and services[0]["name"] == "Яндекс.Такси":
                    self.log("✅ Service data matches")
                else:
                    self.log("❌ Service data mismatch", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to get services: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error getting services: {str(e)}", "ERROR")
            all_passed = False
        
        # Test UPDATE service
        try:
            update_data = {
                "name": "Яндекс.Такси Премиум",
                "logo_base64": sample_logo
            }
            
            response = self.session.put(
                f"{self.base_url}/services/{service_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                updated_service = response.json()
                if updated_service["name"] == "Яндекс.Такси Премиум":
                    self.log("✅ Updated service successfully")
                else:
                    self.log("❌ Service update data mismatch", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to update service: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error updating service: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_phones_crud(self) -> bool:
        """Test CRUD operations for phones"""
        self.log("\n=== Testing Phones CRUD ===")
        
        all_passed = True
        
        # Need an operator ID for phone creation
        if not self.created_ids['operators']:
            self.log("❌ No operators available for phone testing", "ERROR")
            return False
        
        operator_id = self.created_ids['operators'][0]
        
        # Test CREATE phone
        try:
            phone_data = {
                "number": "+79651091162",  # Will be normalized
                "operator_id": operator_id
            }
            
            response = self.session.post(
                f"{self.base_url}/phones",
                json=phone_data
            )
            
            if response.status_code == 200:
                phone = response.json()
                phone_id = phone["_id"]  # Use _id instead of id
                self.created_ids['phones'].append(phone_id)
                self.log(f"✅ Created phone: {phone['number']} (ID: {phone_id})")
                
                # Verify normalization
                if phone["number"] == "+7 965 109 11 62":
                    self.log("✅ Phone number normalized correctly")
                else:
                    self.log(f"❌ Phone normalization failed: {phone['number']}", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to create phone: {response.status_code} - {response.text}", "ERROR")
                all_passed = False
                return all_passed
                
        except Exception as e:
            self.log(f"❌ Error creating phone: {str(e)}", "ERROR")
            all_passed = False
            return all_passed
        
        # Test duplicate phone creation (should fail)
        try:
            duplicate_phone_data = {
                "number": "89651091162",  # Same number, different format
                "operator_id": operator_id
            }
            
            response = self.session.post(
                f"{self.base_url}/phones",
                json=duplicate_phone_data
            )
            
            if response.status_code == 409:
                self.log("✅ Correctly rejected duplicate phone number")
            else:
                self.log(f"❌ Should have rejected duplicate phone: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error testing duplicate phone: {str(e)}", "ERROR")
            all_passed = False
        
        # Test GET all phones
        try:
            response = self.session.get(f"{self.base_url}/phones")
            
            if response.status_code == 200:
                phones = response.json()
                self.log(f"✅ Retrieved {len(phones)} phones")
            else:
                self.log(f"❌ Failed to get phones: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error getting phones: {str(e)}", "ERROR")
            all_passed = False
        
        # Test invalid operator ID
        try:
            invalid_phone_data = {
                "number": "+79651091163",
                "operator_id": "invalid_id"
            }
            
            response = self.session.post(
                f"{self.base_url}/phones",
                json=invalid_phone_data
            )
            
            if response.status_code == 400:
                self.log("✅ Correctly rejected invalid operator ID")
            else:
                self.log(f"❌ Should have rejected invalid operator ID: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error testing invalid operator ID: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_usage_tracking(self) -> bool:
        """Test usage tracking functionality"""
        self.log("\n=== Testing Usage Tracking ===")
        
        all_passed = True
        
        # Need phone and service IDs
        if not self.created_ids['phones'] or not self.created_ids['services']:
            self.log("❌ No phones or services available for usage testing", "ERROR")
            return False
        
        phone_id = self.created_ids['phones'][0]
        service_id = self.created_ids['services'][0]
        
        # Test CREATE usage
        try:
            usage_data = {
                "phone_id": phone_id,
                "service_id": service_id
            }
            
            response = self.session.post(
                f"{self.base_url}/usage",
                json=usage_data
            )
            
            if response.status_code == 200:
                usage = response.json()
                usage_id = usage["id"]
                self.created_ids['usage'].append(usage_id)
                self.log(f"✅ Created usage record (ID: {usage_id})")
            else:
                self.log(f"❌ Failed to create usage: {response.status_code} - {response.text}", "ERROR")
                all_passed = False
                return all_passed
                
        except Exception as e:
            self.log(f"❌ Error creating usage: {str(e)}", "ERROR")
            all_passed = False
            return all_passed
        
        # Test duplicate usage (should fail)
        try:
            duplicate_usage_data = {
                "phone_id": phone_id,
                "service_id": service_id
            }
            
            response = self.session.post(
                f"{self.base_url}/usage",
                json=duplicate_usage_data
            )
            
            if response.status_code == 409:
                self.log("✅ Correctly rejected duplicate usage")
            else:
                self.log(f"❌ Should have rejected duplicate usage: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error testing duplicate usage: {str(e)}", "ERROR")
            all_passed = False
        
        # Test GET all usage
        try:
            response = self.session.get(f"{self.base_url}/usage")
            
            if response.status_code == 200:
                usage_records = response.json()
                self.log(f"✅ Retrieved {len(usage_records)} usage records")
            else:
                self.log(f"❌ Failed to get usage records: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error getting usage records: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_search_functionality(self) -> bool:
        """Test search functionality"""
        self.log("\n=== Testing Search Functionality ===")
        
        all_passed = True
        
        # Test search by phone number
        try:
            response = self.session.get(f"{self.base_url}/search?q=965")
            
            if response.status_code == 200:
                results = response.json()
                self.log(f"✅ Search by phone partial returned {len(results)} results")
                
                # Check if we have phone results
                phone_results = [r for r in results if r["type"] == "phone"]
                if phone_results:
                    self.log("✅ Found phone in search results")
                else:
                    self.log("❌ No phone found in search results", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to search by phone: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error searching by phone: {str(e)}", "ERROR")
            all_passed = False
        
        # Test search by service name
        try:
            response = self.session.get(f"{self.base_url}/search?q=Яндекс")
            
            if response.status_code == 200:
                results = response.json()
                self.log(f"✅ Search by service name returned {len(results)} results")
                
                # Check if we have service results
                service_results = [r for r in results if r["type"] == "service"]
                if service_results:
                    self.log("✅ Found service in search results")
                else:
                    self.log("❌ No service found in search results", "ERROR")
                    all_passed = False
            else:
                self.log(f"❌ Failed to search by service: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error searching by service: {str(e)}", "ERROR")
            all_passed = False
        
        # Test search with normalized phone number
        try:
            response = self.session.get(f"{self.base_url}/search?q=+79651091162")
            
            if response.status_code == 200:
                results = response.json()
                self.log(f"✅ Search by full phone number returned {len(results)} results")
            else:
                self.log(f"❌ Failed to search by full phone: {response.status_code}", "ERROR")
                all_passed = False
                
        except Exception as e:
            self.log(f"❌ Error searching by full phone: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_error_handling(self) -> bool:
        """Test error handling scenarios"""
        self.log("\n=== Testing Error Handling ===")
        
        all_passed = True
        
        # Test invalid IDs
        invalid_id = "invalid_object_id"
        
        endpoints_to_test = [
            f"/operators/{invalid_id}",
            f"/services/{invalid_id}",
            f"/phones/{invalid_id}"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                
                if response.status_code == 400:
                    self.log(f"✅ Correctly handled invalid ID for {endpoint}")
                else:
                    self.log(f"❌ Should have returned 400 for invalid ID {endpoint}: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Error testing invalid ID for {endpoint}: {str(e)}", "ERROR")
                all_passed = False
        
        # Test non-existent IDs
        non_existent_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but doesn't exist
        
        for endpoint in endpoints_to_test:
            endpoint_with_valid_id = endpoint.replace(invalid_id, non_existent_id)
            try:
                response = self.session.get(f"{self.base_url}{endpoint_with_valid_id}")
                
                if response.status_code == 404:
                    self.log(f"✅ Correctly handled non-existent ID for {endpoint_with_valid_id}")
                else:
                    self.log(f"❌ Should have returned 404 for non-existent ID {endpoint_with_valid_id}: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Error testing non-existent ID for {endpoint_with_valid_id}: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def cleanup(self):
        """Clean up created test data"""
        self.log("\n=== Cleaning Up Test Data ===")
        
        # Delete in reverse order to handle dependencies
        for usage_id in self.created_ids['usage']:
            try:
                response = self.session.delete(f"{self.base_url}/usage/{usage_id}")
                if response.status_code == 200:
                    self.log(f"✅ Deleted usage {usage_id}")
                else:
                    self.log(f"❌ Failed to delete usage {usage_id}: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ Error deleting usage {usage_id}: {str(e)}", "ERROR")
        
        for phone_id in self.created_ids['phones']:
            try:
                response = self.session.delete(f"{self.base_url}/phones/{phone_id}")
                if response.status_code == 200:
                    self.log(f"✅ Deleted phone {phone_id}")
                else:
                    self.log(f"❌ Failed to delete phone {phone_id}: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ Error deleting phone {phone_id}: {str(e)}", "ERROR")
        
        for service_id in self.created_ids['services']:
            try:
                response = self.session.delete(f"{self.base_url}/services/{service_id}")
                if response.status_code == 200:
                    self.log(f"✅ Deleted service {service_id}")
                else:
                    self.log(f"❌ Failed to delete service {service_id}: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ Error deleting service {service_id}: {str(e)}", "ERROR")
        
        for operator_id in self.created_ids['operators']:
            try:
                response = self.session.delete(f"{self.base_url}/operators/{operator_id}")
                if response.status_code == 200:
                    self.log(f"✅ Deleted operator {operator_id}")
                else:
                    self.log(f"❌ Failed to delete operator {operator_id}: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ Error deleting operator {operator_id}: {str(e)}", "ERROR")
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all tests and return results"""
        self.log("🚀 Starting UPN Backend API Tests")
        self.log(f"Backend URL: {self.base_url}")
        
        results = {}
        
        # Test connection first
        if not self.test_connection():
            self.log("❌ Cannot proceed without API connection", "ERROR")
            return {"connection": False}
        
        results["connection"] = True
        
        # Run all test suites
        results["phone_normalization"] = self.test_phone_normalization()
        results["operators_crud"] = self.test_operators_crud()
        results["services_crud"] = self.test_services_crud()
        results["phones_crud"] = self.test_phones_crud()
        results["usage_tracking"] = self.test_usage_tracking()
        results["search_functionality"] = self.test_search_functionality()
        results["error_handling"] = self.test_error_handling()
        
        # Clean up
        self.cleanup()
        
        # Summary
        self.log("\n" + "="*50)
        self.log("TEST SUMMARY")
        self.log("="*50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed!")
        else:
            self.log("⚠️  Some tests failed - check logs above")
        
        return results

def main():
    """Main test runner"""
    tester = UPNAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    if not all(results.values()):
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()