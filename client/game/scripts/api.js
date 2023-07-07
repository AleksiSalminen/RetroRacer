
async function getCaptures() {

}

async function uploadCapture() {
    const response = await fetch('/api/captures', {
        method: 'POST',
        body: capture,
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const resJson = await response.json();
    console.log(resJson);
}
