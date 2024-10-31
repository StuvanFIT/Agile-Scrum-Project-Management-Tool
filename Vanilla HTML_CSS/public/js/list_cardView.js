// Function to toggle between list view and card view
function toggleView(view) {


    console.log("Toggling view to:", view);


    const listView = document.getElementById('list-view');
    const cardView = document.getElementById('card-view');

    if (view === 'list') {

        console.log("Switching to list view");

        listView.classList.remove('hide');

        cardView.classList.add('hide');
        
    } else if (view === 'card') {

        console.log("Switching to card view");
        listView.classList.add('hide');
        cardView.classList.remove('hide');
    }
    
    console.log("List view:", listView.classList.contains('hide'));
    console.log("Card view:", cardView.classList.contains('hide'));
}

// Get the buttons by their ID
const listViewButton = document.getElementById('list-view-button');
const cardViewButton = document.getElementById('card-view-button');

// Add event listeners to the buttons
listViewButton.addEventListener('click', () => toggleView('list'));
cardViewButton.addEventListener('click', () => toggleView('card'));

