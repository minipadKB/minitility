/* eslint-disable prettier/prettier */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, redirect, RouterProvider } from 'react-router-dom';

import './index.css';
import Loading from './windows/loading/Loading';
import App from './windows/App';
import DevicePage from './windows/aboutPage/AboutPage';
import DeviceSelect from './windows/devicePage/DevicePage';
import FirstStart from './windows/firstStart/FirstStart';
import InitPage from './windows/initPage/InitPage';

// calling IPC exposed from preload script
window.electron.ipcRenderer.on('ipc-app', (msg) => {
  // eslint-disable-next-line no-console
  console.log(msg);
  redirect("/#/loading");
});

window.electron.ipcRenderer.sendMessage('ipc-app', { test: 'test message' });

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Loading />,
      },
      {
        path: '/devicepage',
        element: <DevicePage />,
      },
      {
        path: '/deviceselect',
        element: <DeviceSelect />,
      },
      {
        path: '/firststart',
        element: <FirstStart />,
      },
      {
        path: '/initpage',
        element: <InitPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
