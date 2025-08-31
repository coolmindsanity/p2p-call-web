**Your current setup is designed for a development environment where the .tsx file is handled automatically. 
To host it on Firebase, we first need to "build" your project into static HTML, CSS, and JavaScript files that browsers can understand directly. 
The easiest way to do this is with a tool like Vite.**

Here’s the full process:
Step 1: Set Up a Build Process with Vite
If you don't have a package.json file in your project folder, create one by running npm init -y in your terminal. Then, install Vite and the React plugin:
```
Bash
npm install --save-dev vite @vitejs/plugin-react
```
Next, you'll need to slightly adjust your index.html. Vite requires the script tag to be inside the <body> and point to index.tsx like this:
code
```
Html
<!-- Inside index.html -->
<body>
  <div id="root"></div>
  <!-- Firebase SDKs -->
  <script src="..."></script>
  <script src="..."></script>
  <!-- Vite entry point -->
  <script type="module" src="/index.tsx"></script>
</body>
```
(Note: Your current index.html already follows this structure, so you're good to go!)
Now, update your package.json file to add build and dev scripts:
code
```
JSON
// In package.json
"scripts": {
  "dev": "vite",
  "build": "vite build"
}
```
Step 2: Install and Configure the Firebase CLI
First, install the Firebase command-line tools globally if you haven't already:
code
```
Bash
npm install -g firebase-tools
```
Next, log in to your Google account from the terminal:
code
```
Bash
firebase login
```
Now, initialize Firebase within your project directory:
code
```
Bash
firebase init
```
You'll be guided through a few prompts. Here’s what to choose:
**Which Firebase features do you want to set up?**
Use the arrow keys to navigate to Hosting: Configure files for Firebase Hosting...
Press the spacebar to select it, then enter to continue.
Please select an option:
Choose Use an existing project.
Select a default Firebase project for this directory:
Choose your project from the list (it should be p2p-call-9efe5).
What do you want to use as your public directory?
Type dist. This is the folder Vite will create when you build your project.
Configure as a single-page app (rewrite all urls to /index.html)?
Type y and press enter. This is important for React apps.
Set up automatic builds and deploys with GitHub?
Type n and press enter. You can set this up later if you wish.
Step 3: Build and Deploy Your App
You're all set! Just two commands left:
Build your project:
Run the build script you added to your package.json. This compiles all your code into the dist folder.
code
```
Bash
npm run build
```
Deploy to Firebase:
This command uploads the contents of your dist folder to Firebase Hosting.
code
```
Bash
firebase deploy
```
After the deployment finishes, the CLI will give you a Hosting URL (e.g., https://p2p-call-9efe5.web.app). 
Your video call app is now live and accessible to anyone with that link