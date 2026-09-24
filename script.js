const detailsToggle = document.querySelector('#details-toggle');
const weeklyDetails = document.querySelector('#weekly-details');

detailsToggle.addEventListener('click', () => {
    const isExpanded = detailsToggle.getAttribute('aria-expanded') === 'true';
    detailsToggle.setAttribute('aria-expanded', String(!isExpanded));
    detailsToggle.textContent = isExpanded ? 'Show weekly details' : 'Hide weekly details';
    weeklyDetails.hidden = isExpanded;
});
