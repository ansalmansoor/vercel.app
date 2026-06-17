// ClaimCard renderer component for SafeTClaim
import { escapeHTML } from '../utils/sanitize.js';

export function renderClaimCard(claim, handlers) {
  // handlers: { onClick }
  const card = document.createElement('div');
  card.className = 'claim-card';
  card.setAttribute('data-id', claim.id);

  // Status mapping classes
  let statusClass = 'status-pending';
  if (claim.status === 'Case Created') statusClass = 'status-case';
  else if (claim.status === 'Approved') statusClass = 'status-approved';
  else if (claim.status === 'Rejected') statusClass = 'status-rejected';

  // Formatting date
  const dateFormatted = new Date(claim.dateAdded).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Issue icon mapping
  let issueIcon = 'help-circle';
  if (claim.issueType === 'Not our item') issueIcon = 'package-x';
  else if (claim.issueType === 'Missing part') issueIcon = 'puzzle';
  else if (claim.issueType === 'Used item') issueIcon = 'recycle';

  // Multiple image count indicator
  const hasImages = claim.images && claim.images.length > 0;
  const mainImage = hasImages ? claim.images[0] : '';
  const imgCount = hasImages ? claim.images.length : 0;

  // XSS Escaped Values
  const shipmentId = escapeHTML(claim.shipmentId);
  const trackingNumber = escapeHTML(claim.trackingNumber);
  const returnType = escapeHTML(claim.returnType || 'Amazon');
  const issueType = escapeHTML(claim.issueType);
  const message = escapeHTML(claim.message || 'No description comments.');
  const addedBy = escapeHTML(claim.addedBy || 'warehouse');

  card.innerHTML = `
    <div class="card-top">
      <div class="card-header-info">
        <h4 class="card-shipment-id" title="${shipmentId}">${shipmentId}</h4>
        <span class="card-tracking-num" title="${trackingNumber}">Tracking: ${trackingNumber}</span>
      </div>
      <span class="status-badge ${statusClass}">${claim.status}</span>
    </div>
    
    <div class="card-body">
      ${hasImages ? `
        <div class="card-img-preview">
          <img src="${mainImage}" alt="Evidence Preview">
          ${imgCount > 1 ? `<div class="card-img-count-overlay">+${imgCount}</div>` : ''}
        </div>
      ` : `
        <div class="card-img-preview">
          <div class="card-img-count-overlay" style="background-color: rgba(255,255,255,0.03);"><i data-lucide="image-off" style="color: var(--color-text-dark);"></i></div>
        </div>
      `}
      
      <div class="card-details">
        <div class="card-issue-row">
          <span class="card-channel-badge">${returnType}</span>
          <i data-lucide="${issueIcon}"></i>
          <span>${issueType}</span>
        </div>
        <p class="card-comments">${message}</p>
      </div>
    </div>

    <div class="card-meta-bottom">
      <span>By: ${addedBy}</span>
      <span>${dateFormatted}</span>
    </div>
  `;

  // Attach card click event
  card.addEventListener('click', () => {
    handlers.onClick(claim.id);
  });

  return card;
}
