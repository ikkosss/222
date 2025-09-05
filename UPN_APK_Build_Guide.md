# UPN Mobile App - APK Build Guide

## App Information
- **App Name**: UPN - Трекер номеров  
- **Package**: com.ikkosss.numbers
- **Version**: 1.0.0
- **Platform**: Android
- **Technology**: React Native + Expo

## Current Status
✅ The UPN mobile app has been successfully built and exported!

### Features Implemented:
- ✅ **Russian Phone Number Tracking** - Track phone usage across services
- ✅ **Google-style Search Interface** - 100% width, 90% height input field
- ✅ **Custom Navigation** - ПОИСК, НОМЕРА, МЕСТА horizontal buttons
- ✅ **CRUD Operations** - Add phones, services, operators with images
- ✅ **Usage Tracking** - Mark phones as used/unused in services
- ✅ **Dark/Light Theme** - Automatic theme switching
- ✅ **Image Support** - Base64 logo storage for operators and services
- ✅ **Export/Import** - Database backup functionality
- ✅ **Statistics** - Comprehensive usage analytics

## How to Get the APK

### Option 1: Use EAS Build Service (Recommended)
1. Install Expo CLI: `npm install -g @expo/cli`
2. Login to Expo: `npx expo login`
3. Navigate to project: `cd /app/frontend`
4. Build APK: `npx eas build --platform android --profile preview`
5. Download APK from the provided link

### Option 2: Local Build (Advanced)
1. Copy the exported bundle from `/app/frontend/dist/`
2. Use Android Studio or Gradle to build the APK
3. Follow React Native building guidelines

### Option 3: Development Build
1. Install Expo Go app on your Android device
2. Scan the QR code from the development server
3. Test the app directly without building APK

## Exported Files Location
- **Bundle**: `/app/frontend/dist/`
- **Metadata**: `/app/frontend/dist/metadata.json`
- **Assets**: `/app/frontend/dist/assets/`
- **JavaScript Bundle**: `/app/frontend/dist/_expo/static/js/android/`

## App Configuration
```json
{
  "name": "UPN - Трекер номеров",
  "package": "com.ikkosss.numbers", 
  "version": "1.0.0",
  "jsEngine": "jsc"
}
```

## Backend Integration
The app is configured to work with the FastAPI backend:
- **API Endpoint**: Configurable via environment variables
- **Database**: MongoDB with phone, service, operator, usage collections
- **Search**: Real-time search with Russian phone number normalization

## Testing
The app has been thoroughly tested:
- ✅ All screens functional
- ✅ Navigation working properly
- ✅ Search functionality operational
- ✅ CRUD operations tested
- ✅ Image upload/display working
- ✅ Mobile-responsive design confirmed

## Next Steps
1. Choose one of the build options above
2. Install the APK on your Android device
3. Configure backend URL if needed
4. Start tracking your phone numbers!

---
**Note**: The app is production-ready with all requested features implemented according to the original specifications.