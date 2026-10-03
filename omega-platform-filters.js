// Filter products by agent in the platform navigator
function filterProducts(agent) {
  const cards = document.querySelectorAll('.product-card');
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach(btn => btn.classList.remove('active'));

  // Find and activate the clicked button based on agent
  buttons.forEach(btn => {
    if (btn.dataset.filterAgent === agent || (agent === 'all' && btn.dataset.filterAgent === 'all')) {
      btn.classList.add('active');
    }
  });

  cards.forEach(card => {
    if (agent === 'all' || card.dataset.agent === agent) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });

  // Also filter sections
  document.querySelectorAll('.agent-section').forEach(section => {
    if (agent === 'all' || section.dataset.agent === agent) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
}

// Event delegation for filter buttons
document.addEventListener('DOMContentLoaded', function() {
  const navBar = document.querySelector('.nav-bar');
  if (navBar) {
    navBar.addEventListener('click', function(e) {
      const btn = e.target.closest('.filter-btn');
      if (btn && btn.dataset.filterAgent) {
        filterProducts(btn.dataset.filterAgent);
      }
    });
  }
});
