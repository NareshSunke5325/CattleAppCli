# Cattle Yard Management App

A comprehensive React Native application for managing cattle yard operations, built with modern technologies and best practices.

## Features

- **Dashboard**: Real-time overview of yard capacity, livestock distribution, and revenue
- **Yard Management**: Monitor and manage multiple cattle yards with capacity tracking
- **Livestock Tracking**: Track individual animals and herd types
- **User Authentication**: Secure login system with role-based access
- **Mobile-First Design**: Optimized for mobile devices with responsive design

## Technology Stack

- **React Native 0.74.2**: Cross-platform mobile development
- **Redux Toolkit**: State management with persistence
- **React Navigation**: Navigation with drawer and stack navigators
- **TypeScript**: Type-safe development
- **Vector Icons**: Material Design icons
- **Axios**: HTTP client for API communication

## Getting Started

### Prerequisites

Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions.

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS, install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

### Running the App

#### For Android
```bash
npm run android
```

#### For iOS
```bash
npm run ios
```

### Building APK

#### Debug APK
```bash
npm run build:android-debug
```

#### Release APK
```bash
npm run build:android
```

The APK will be generated in `android/app/build/outputs/apk/`

## Project Structure

```
src/
├── components/          # React Native components
├── store/              # Redux store and slices
├── theme/              # Colors, fonts, and styling
└── utils/              # Utility functions and route configurations
```

## Key Features

### Dashboard
- Real-time yard capacity monitoring
- Livestock distribution charts
- Revenue tracking by yard
- Quick access to all major functions

### Yard Management
- View all cattle yards with status indicators
- Track deck availability and occupancy
- Search and filter yards
- Book available decks

### Authentication
- Secure login with username/password
- Token-based authentication
- Persistent login state
- Role-based access control

## Development

### Default Login Credentials
- Username: `manager`
- Password: `password123`

### Mock Data
The app currently uses mock data for development. Replace the mock API calls in the Redux slices with actual API endpoints when ready.

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new components
3. Implement proper error handling
4. Add appropriate loading states
5. Follow React Native best practices

## License

This project is proprietary software developed by Object Technology Solutions.

## Support

For support and questions, contact the development team at Object Technology Solutions.