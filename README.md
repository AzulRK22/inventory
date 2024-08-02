# Azul's Shop

Azul's Shop is an inventory management application built with React and Material-UI, allowing users to add, delete, and search for items in their inventory, as well as get recipe suggestions based on available ingredients.

## Preview

Here are a couple of preview images of the application:

![Preview 1](images/1.png)
*Preview of the Main Screen*

![Preview 2](images/2.png)
*Preview of the Add Item Modal*

## Features

- **Inventory Management**: Add, delete, and view items in the inventory.
- **Image Upload**: Allows uploading item images or taking photos directly from the camera.
- **Automatic Image Detection**: Uses the Google Cloud Vision API to automatically detect the item name from an image.
- **Recipe Suggestions**: Get recipe suggestions based on the ingredients in your inventory using the OpenAI API.

## Technologies

- **React**: Library for building the user interface.
- **Material-UI**: Styled UI components.
- **Firebase**: Used for cloud storage and database.
- **Google Cloud Vision API**: For image label detection.
- **OpenAI API**: For recipe suggestions.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AzulRK22/inventory.git
   
2. Navigate to the project directory:
   cd inventory
3. Install the dependencies:
   npm install
4. Configure the environment variables. Create a .env.local file in the root of the project with the following content:
    NEXT_PUBLIC_API_URL=your_api_url
    NEXT_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_api_key
    NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
5.Start the development server:
   npm run dev
  Open http://localhost:3000 in your browser to see the application in action.

## Usage

Search Items: Use the search field to filter items in the inventory.
Add Items: Click on "Add New Item" to open the modal and add a new item. You can upload an image, take a photo, or use automatic image detection.
Delete Items: Click on "Remove" on any item card to delete it from the inventory.
Get Recipe Suggestions: Click on the lightbulb icon to get recipe suggestions based on the items in the inventory.

## Project Structure

- **pages/index.js:** Main component handling the application logic.
- **firebase.js:** Firebase configuration.
- **components/:** Reusable components.

## Contributions

Contributions are welcome. If you would like to contribute, please open an issue or a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.


## Contact

If you have any questions, feel free to contact me through my website at https://www.azulrk.com

This README.md file covers the initial setup, usage of the application, and additional details about the technologies used and how to contribute. I hope you find it helpful!

Let me know if you need any further adjustments!



