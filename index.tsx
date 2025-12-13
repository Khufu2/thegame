import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for caching and offline functionality (disabled for debugging)
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);

//         // Request notification permission
//         if ('Notification' in window && 'serviceWorker' in navigator) {
//           Notification.requestPermission().then((permission) => {
//             if (permission === 'granted') {
//               console.log('Notification permission granted');
//             }
//           });
//         }

//         // Handle service worker updates
//         registration.addEventListener('updatefound', () => {
//           const newWorker = registration.installing;
//           if (newWorker) {
//             newWorker.addEventListener('statechange', () => {
//               if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
//                 // New content is available, notify user
//                 if (confirm('New content is available. Reload to get the latest version?')) {
//                   window.location.reload();
//                 }
//               }
//             });
//           }
//         });
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }