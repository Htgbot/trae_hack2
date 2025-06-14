# Explain Anything Visualizer

A full-stack web application that explains any concept, molecule, formula, or technical topic using Novita AI at three different levels of detail. The application provides a modern user interface with the ability to save explanations to a local knowledge gallery.


## Features

- **Multi-level Explanations**: Choose from three explanation levels:
  - **Simple**: Easy to understand explanations for beginners or children
  - **Step-by-step**: Clear explanations with examples for students
  - **Technical**: In-depth explanations for advanced learners or professionals
- **Modern UI**: Clean, responsive interface built with Bootstrap 5
- **Knowledge Gallery**: Save all explanations locally for future reference
- **Text-to-Speech**: Listen to explanations with built-in speech synthesis
- **Thinking Process**: View the AI's thinking process behind each explanation
- **Novita AI Integration**: Powered by Novita AI's advanced language models

## Screenshots

### Main Interface
![Main Interface](screenshots/Screenshot%202025-06-14%20235854.png)

### Explanation with Thinking Process
![Explanation with Thinking Process](screenshots/Screenshot%202025-06-14%20235911.png)

### Knowledge Gallery
![Knowledge Gallery](screenshots/Screenshot%202025-06-14%20235926.png)

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - Bootstrap 5 (UI framework)
  - Bootstrap Icons
  - Web Speech API (for text-to-speech)

- **Backend**:
  - Node.js
  - Express.js (web server)
  - node-fetch (for API requests)
  - dotenv (for environment variables)

- **AI Integration**:
  - Novita AI API (OpenAI API compatible)
  - Model: qwen/qwen3-4b-fp8

## Installation

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- Novita AI API key

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/explain-anything-visualizer.git

# Navigate to the project directory
cd explain-anything-visualizer
```

### Install Dependencies

```bash
npm install
```

This will install all required dependencies: express, node-fetch, and dotenv.

### Configure Environment Variables

1. Create a `.env` file in the project root (or copy from the example):

```bash
cp .env.example .env
```

2. Open the `.env` file and add your Novita AI API key:

```
NOVITA_API_KEY=your_novita_api_key_here
```

## Running the Application

```bash
# Start the server
npm start
```

Alternatively, you can run:

```bash
node server.js
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## How It Works

### Architecture

The application follows a simple client-server architecture:

1. **Frontend**: HTML/CSS/JavaScript that provides the user interface
2. **Backend**: Node.js/Express server that handles API requests
3. **External API**: Novita AI API for generating explanations

### Explanation Process

1. User enters a topic and selects an explanation level (Simple, Step-by-step, or Technical)
2. The frontend sends a request to the backend server
3. The server constructs a request to the Novita AI API with:
   - A system prompt based on the selected level
   - The user's topic as the user prompt
4. Novita AI generates an explanation
5. The server adds a thinking process section if not already present
6. The explanation is returned to the frontend and displayed to the user
7. The user can save the explanation to their local knowledge gallery

### Knowledge Gallery

Explanations are saved in the browser's localStorage, allowing users to:
- Build a personal collection of explanations
- Access saved explanations even after closing the browser
- Delete explanations they no longer need

### Text-to-Speech

The application uses the Web Speech API to provide text-to-speech functionality:
- Each AI response includes a speaker button
- Clicking the button reads the explanation aloud
- The speech can be paused and resumed

### Thinking Process

Each explanation includes the AI's thinking process:
- The thinking is separated from the main explanation
- Users can toggle the visibility of the thinking section
- This provides insight into how the AI approaches different explanation levels

## Development

### Project Structure

- `index.html`: Main HTML file with the application UI
- `style.css`: CSS styles for the application
- `main.js`: Frontend JavaScript handling UI interactions and API calls
- `server.js`: Backend server handling API requests and Novita AI integration
- `.env`: Environment variables (API keys)
- `package.json`: Project dependencies and scripts

### Mock Responses

If no valid Novita API key is provided, the application will use mock responses for demonstration purposes.

## License

[MIT License](LICENSE)

## Acknowledgements

- [Novita AI](https://novita.ai) for providing the AI API
- [Bootstrap](https://getbootstrap.com) for the UI framework
- [Express.js](https://expressjs.com) for the web server framework