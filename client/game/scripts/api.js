
async function getCaptures() {

}

async function uploadCapture() {
    fetch('/api/captures', {
        method: 'POST',
        body: JSON.stringify(capture),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(console.log());
}
