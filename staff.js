document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const loadingMessage = document.getElementById('loadingMessage');
    const marksheetsContainer = document.getElementById('marksheetsContainer');
    const alertModal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const alertCloseButton = document.getElementById('alertCloseButton');
    const clearStudentButton = document.getElementById('clearStudentButton');

    let marksheets = []; // Array to hold multiple marksheets

    fileInput.addEventListener('change', handleFile);
    alertCloseButton.addEventListener('click', () => {
        alertModal.style.display = 'none';
    });
    clearStudentButton.addEventListener('click', clearAllFromStudent);

    function handleFile(event) {
        const file = event.target.files[0];
        if (!file) {
            displayError("No file selected.");
            return;
        }

        const reader = new FileReader();
        loadingMessage.style.display = 'block'; // Show loading message

        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                const newStudentData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (newStudentData.length > 0) {
                    const marksheetId = Date.now(); // Unique ID for each marksheet
                    marksheets.push({ id: marksheetId, data: newStudentData });
                    localStorage.setItem('marksheets', JSON.stringify(marksheets));
                    displayMarksheets();
                } else {
                    displayError("No data found in the uploaded file.");
                }
            } catch (error) {
                displayError("Error processing file: " + error.message);
            } finally {
                loadingMessage.style.display = 'none'; // Hide loading message
            }
        };

        reader.onerror = function() {
            displayError("Error reading file.");
            loadingMessage.style.display = 'none'; // Hide loading message
        };

        reader.readAsArrayBuffer(file);
    }

    function displayMarksheets() {
        marksheetsContainer.innerHTML = '';

        marksheets.forEach(marksheet => {
            const div = document.createElement('div');
            div.className = 'marksheet';

            const table = document.createElement('table');
            const headerRow = document.createElement('tr');
            marksheet.data[0].forEach(cell => {
                const th = document.createElement('th');
                th.textContent = cell;
                headerRow.appendChild(th);
            });
            table.appendChild(headerRow);

            marksheet.data.slice(1).forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });

            div.appendChild(table);

            const shareButton = document.createElement('button');
            shareButton.textContent = 'Share Results';
            shareButton.className = 'share';
            shareButton.addEventListener('click', () => shareResults(marksheet.id));

            const deleteFromStudentButton = document.createElement('button');
            deleteFromStudentButton.textContent = 'Delete from Student';
            deleteFromStudentButton.className = 'delete';
            deleteFromStudentButton.addEventListener('click', () => deleteResultsFromStudent(marksheet.id));

            const deleteFromStaffButton = document.createElement('button');
            deleteFromStaffButton.textContent = 'Delete from Staff';
            deleteFromStaffButton.className = 'delete-from-staff';
            deleteFromStaffButton.addEventListener('click', () => deleteResultsFromStaff(marksheet.id));

            div.appendChild(shareButton);
            div.appendChild(deleteFromStudentButton);
            div.appendChild(deleteFromStaffButton);

            marksheetsContainer.appendChild(div);
        });
    }

    function shareResults(marksheetId) {
        const marksheet = marksheets.find(ms => ms.id === marksheetId);
        
        if (marksheet) {
            let allResults = JSON.parse(localStorage.getItem('studentResults')) || [];
            allResults.push({ id: marksheetId, data: marksheet.data }); // Wrap data in an object
            localStorage.setItem('studentResults', JSON.stringify(allResults));
            showAlert("Results are now visible to all students!", "success"); // Custom alert message
        } else {
            displayError("Marksheets not found.");
        }
    }

    function deleteResultsFromStudent(marksheetId) {
        let allResults = JSON.parse(localStorage.getItem('studentResults')) || [];
        
        // Filter out the results corresponding to the marksheetId
        allResults = allResults.filter(result => result.id !== marksheetId);
        
        localStorage.setItem('studentResults', JSON.stringify(allResults));
        showAlert("Results have been deleted from the student portal!", "success"); // Custom alert message
    }

    function deleteResultsFromStaff(marksheetId) {
        const marksheetIndex = marksheets.findIndex(ms => ms.id === marksheetId);
        
        if (marksheetIndex > -1) {
            marksheets.splice(marksheetIndex, 1);
            localStorage.setItem('marksheets', JSON.stringify(marksheets));
            displayMarksheets();
            showAlert("Marksheets deleted from the staff portal!", "success"); // Custom alert message
        } else {
            displayError("Marksheets not found.");
        }
    }

    function clearAllFromStudent() {
        localStorage.removeItem('studentResults');
        showAlert("All results have been cleared from the student portal!", "success"); // Custom alert message
    }

    function displayMessage(message) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = 'success-message';
        messageDiv.style.display = 'block';
    }

    function displayError(message) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = 'error-message';
        messageDiv.style.display = 'block';
    }

    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = type === "success" ? 'alert-success' : 'alert-error'; // Apply class based on type
        alertModal.style.display = 'block';
    }

    // Load marksheets from local storage on page load
    function loadMarksheets() {
        const storedMarksheets = localStorage.getItem('marksheets');
        if (storedMarksheets) {
            marksheets = JSON.parse(storedMarksheets);
            displayMarksheets();
        }
    }

    loadMarksheets();
});
