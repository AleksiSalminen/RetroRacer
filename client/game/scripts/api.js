
async function getCapture(id, map) {
    fetch('/api/captures/' + id + "?" + new URLSearchParams({ map: map }))
    .then(response => response.json())
    .then(capture => {
        console.log(capture);
    });
}

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
