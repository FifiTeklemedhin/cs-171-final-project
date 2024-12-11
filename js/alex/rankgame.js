const correctOrder = [
    "sexually explicit",
    "offensive",
    "age group",
    "language",
    "unsuited"
];

const bannedBooksData = {
    "sexually explicit": 41,
    "offensive": 30,
    "age group": 29,
    "language": 28,
    "unsuited": 28
};


const draggables = document.querySelectorAll('.draggable');
const dropZones = document.querySelectorAll('.drop-zone');

draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', draggable.dataset.reason);

        const parentZone = draggable.parentElement;
        if (parentZone.classList.contains('drop-zone')) {
            const zoneNumber = parentZone.querySelector('.zone-number');
            if (zoneNumber) {
                zoneNumber.style.display = ""; // Show the number again
            }
            parentZone.classList.remove('filled');
        }
    });

    draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
    });
});

dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow the drop
        zone.classList.add('filled');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('filled');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('filled');

        const reason = e.dataTransfer.getData('text/plain');
        const draggable = document.querySelector(`.draggable[data-reason="${reason}"]`);

        if (zone.firstChild) {
            document.querySelector('.right-column').appendChild(zone.firstChild);
        }

        zone.appendChild(draggable);

        const zoneNumber = zone.querySelector('.zone-number');
        if (zoneNumber) {
            zoneNumber.style.display = "none";
        }
    });
});


document.getElementById('showCorrectButton').addEventListener('click', () => {
    const maxBannedBooks = Math.max(...Object.values(bannedBooksData));

    dropZones.forEach((zone, index) => {
        const correctReason = correctOrder[index];
        const correctDraggable = document.querySelector(`.draggable[data-reason="${correctReason}"]`);
        const currentDraggable = zone.querySelector('.draggable');

        const bannedBooksCount = bannedBooksData[correctReason];
        const scaledWidth = (bannedBooksCount / maxBannedBooks) * 100;

        zone.style.width = `${scaledWidth}%`;

        const countText = document.createElement('span');
        countText.textContent = bannedBooksCount;
        countText.classList.add('banned-count');
        zone.appendChild(countText);

        countText.style.position = "absolute";
        countText.style.right = "10px";
        countText.style.top = "50%";
        countText.style.transform = "translateY(-50%)";


        if (currentDraggable && currentDraggable.dataset.reason !== correctReason) {
            document.querySelector('.right-column').appendChild(currentDraggable);
        }

        if (correctDraggable && correctDraggable.parentElement !== zone) {
            zone.appendChild(correctDraggable);

            correctDraggable.classList.add('correct');
            zone.classList.add('correct');
        }

        zone.style.transition = "width 1s ease";
        correctDraggable.style.transition = "transform 1s ease, background-color 0.5s ease";

        const zoneNumber = zone.querySelector('.zone-number');
        if (zoneNumber) {
            zoneNumber.style.display = "none";
        }
    });
});


document.getElementById('gradeButton').addEventListener('click', () => {


    dropZones.forEach((zone, index) => {
        const draggable = zone.querySelector('.draggable');
        const reason = draggable ? draggable.dataset.reason : undefined;
        const correctReason = correctOrder[index];

        console.log(`Zone ${index + 1}:`);
        console.log(`Reason = "${reason}"`);
        console.log(`Correct Reason = "${correctReason}"`);

        if (reason === correctReason) {
            zone.classList.add('correct');
            zone.classList.remove('incorrect');
        } else {
            zone.classList.add('incorrect');
            zone.classList.remove('correct');
        }
    });
});

/*
const tooltipData = {
    "sexually explicit": "Fifty Shades of Grey, by E. L. James, was challenged because of sexually explicit content that was both 'poorly written' and caused 'concerns that a group of teenagers will want to try it.'",
    "offensive": "The Captain Underpants series by Dan Pilkey was challenged because it was perceived as 'encouraging disruptive behavior.'",
    "age group": "The Absolutely True Diary of a Part-Time Indian, by Sherman Alexie, was consistently challenged for acknowledging issues such as poverty, alcoholism, and sexuality. It was challenged in school curriculums because of offensive language.",
    "language": "Make Something Up: Stories You Can't Unread, by Chuck Palahniuk, was challenged for profanity and being 'disgusting and all around offensive.'",
    "unsuited": "George, by Alex Gino, was banned, challenged, and relocated because it was believed to encourage children to clear browser history."
};

dropZones.forEach((zone, index) => {
    const reason = correctOrder[index];

    zone.addEventListener('mouseenter', function () {
        const mytooltip = document.createElement('div');
        mytooltip.classList.add('tooltip');
        mytooltip.textContent = tooltipData[reason];
        document.getElementById("ranking-game").appendChild(mytooltip);

        const zoneRect = zone.getBoundingClientRect();
        mytooltip.style.position = 'absolute';
        mytooltip.style.top = `${zoneRect.top + window.scrollY - 20}px`;
        mytooltip.style.left = `${zoneRect.right + window.scrollX + 10}px`;

        mytooltip.style.display = 'block';
    });

    zone.addEventListener('mouseleave', function () {
        const mytooltip = document.querySelector('.mytooltip');
        if (mytooltip) {
            mytooltip.remove();
        }
    });
});
*/

document.getElementById('playAgainButton').addEventListener('click', () => {
    dropZones.forEach(zone => {
        const currentDraggable = zone.querySelector('.draggable');
        if (currentDraggable) {
            zone.removeChild(currentDraggable);
        }

        zone.style.width = '';

        const zoneNumber = zone.querySelector('.zone-number');
        if (zoneNumber) {
            zoneNumber.style.display = '';
        }

        zone.classList.remove('correct', 'incorrect');
    });

    draggables.forEach(draggable => {
        draggable.classList.remove('correct', 'incorrect');

        document.querySelector('.right-column').appendChild(draggable);
    });

    document.querySelectorAll('.banned-count').forEach(countText => {
        countText.remove();
    });

});


