
var selectRace = document.getElementById('map_select_race');
var selectTimeTrial = document.getElementById('map_select_time_trial');
var opt;
for (var i = 0; i < MAPS.length; i++) {
    opt = document.createElement('option');
    opt.value = MAPS[i].id;
    opt.innerHTML = MAPS[i].name;
    selectRace.appendChild(opt);
    opt = document.createElement('option');
    opt.value = MAPS[i].id;
    opt.innerHTML = MAPS[i].name;
    selectTimeTrial.appendChild(opt);
}

function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.getElementById("defaultOpen").click();
