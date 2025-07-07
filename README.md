# EyeTrack Access - Eye-Controlled Accessibility Interface
EyeTrack Access is a revolutionary browser-based system that enables hands-free digital interface control for people with disabilities. Using real-time eye tracking via webcam, this application allows users to interact with digital interfaces using only their eye movements.


## Features
- **Real-time eye tracking**: Tracks gaze direction with WebGazer.js
- **Blink detection**: Uses eye blinks as click actions
- **Virtual keyboard**: Full QWERTY keyboard controlled by eye movements
- **Dwell time selection**: Gaze at elements to select them after 1.5 seconds
- **Calibration system**: Personalizes tracking accuracy for each user
- **Privacy-focused**: All processing happens client-side
- **Responsive design**: Works on all modern browsers and devices

  
## How It Works
1. **Calibration**: Users complete a simple 5-point calibration process
2. **Cursor control**: Eye movements control a red cursor dot on screen
3. **Interaction**:
   - Look at interface elements to select them
   - Blink to immediately select items
   - Dwell on elements for 1.5 seconds to select
4. **Typing**:
   - Open the virtual keyboard
   - Look at keys to select them
   - Blink to type immediately
   - Use special keys: Shift, Space, Backspace, Enter
  
     
## Technologies Used
- React.js
- WebGazer.js (for eye tracking)
- Modern CSS (Flexbox, Grid, Animations)
- HTML5

  
## Getting Started
### Prerequisites
- Modern web browser (Chrome, Firefox, Edge)
- Webcam
- React.js (for development)
  
### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/eyetrack-access.git
cd eyetrack-access
```
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm start
```
4. Open your browser to http://localhost:3000

   
## Usage Instructions
1. Allow camera access when prompted
2. Complete the calibration process by clicking on the blue dots
3. After calibration, the system is ready
4. Toggle the virtual keyboard with the "Show Keyboard" button
5. Type by looking at keys and either:
   - Blinking to select immediately
   - Waiting for the progress bar to fill (1.5 seconds)
6. Use special keys:
   - Shift: Toggle uppercase letters
   - Space: Insert space
   - Enter: New line
   - Backspace: Delete last character
   - Hide: Close keyboard
  
     
## Customization
The application can be customized by modifying:
- Dwell time duration in `App.js`
- Keyboard layout in `keyboardLayout` array
- Color schemes in CSS variables
- Calibration points in `calibrationPoints`

  
## Troubleshooting
If you encounter issues:
- Ensure good lighting on your face
- Position yourself 50-70cm from the camera
- Remove glasses if they cause glare
- Try recalibrating using the "Recalibrate" button
- Refresh the page if tracking becomes unresponsive

  
## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
