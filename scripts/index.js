
var select = document.getElementById('map_select');
var opt;
for (var i = 0; i < MAPS.length; i++) {
    opt = document.createElement('option');
    opt.value = MAPS[i].id;
    opt.innerHTML = MAPS[i].name;
    select.appendChild(opt);
}
