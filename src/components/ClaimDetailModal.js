// ClaimDetailModal component for SafeTClaim
import { escapeHTML } from '../utils/sanitize.js';

export class ClaimDetailModal {
  constructor(handlers) {
    this.modal = document.getElementById('claim-detail-modal');
    this.shipmentTitle = document.getElementById('detail-shipment-title');
    this.statusBadge = document.getElementById('detail-status-badge');
    this.deleteBtn = document.getElementById('detail-delete-btn');
    this.downloadZipBtn = document.getElementById('detail-download-zip-btn');
    this.downloadSingleBtn = document.getElementById('detail-download-single-btn');
    
    // Carousel
    this.prevBtn = document.getElementById('prev-image-btn');
    this.nextBtn = document.getElementById('next-image-btn');
    this.indicator = document.getElementById('carousel-indicator');
    this.imgElement = document.getElementById('detail-img');
    
    // Details
    this.shipmentIdText = document.getElementById('detail-shipment-id');
    this.trackingText = document.getElementById('detail-tracking');
    this.returnTypeText = document.getElementById('detail-return-type');
    this.issueText = document.getElementById('detail-issue-type');
    this.reporterText = document.getElementById('detail-reporter');
    this.dateText = document.getElementById('detail-date');
    this.messageText = document.getElementById('detail-message');
    
    // Manager Panel
    this.managerPanel = document.getElementById('manager-status-panel');
    this.statusSelect = document.getElementById('manager-status-select');
    this.commentInput = document.getElementById('manager-comment-input');
    this.saveStatusBtn = document.getElementById('manager-save-status-btn');
    
    // Timeline
    this.timelineContainer = document.getElementById('detail-history-timeline');

    this.handlers = handlers; // { onStatusChange, onDelete }
    
    this.currentClaim = null;
    this.currentImageIdx = 0;

    this.initEventListeners();
  }

  initEventListeners() {
    // Close modal triggers
    this.modal.querySelectorAll('.modal-close-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    });

    // Single Photo Download Button
    this.downloadSingleBtn.addEventListener('click', () => {
      if (this.currentClaim && this.currentClaim.images && this.currentClaim.images.length > 0) {
        this.downloadCurrentPhoto();
      }
    });

    // ZIP Download Button
    this.downloadZipBtn.addEventListener('click', () => {
      if (this.currentClaim) {
        this.downloadEvidenceZip();
      }
    });

    // Carousel Navigate
    this.prevBtn.addEventListener('click', () => {
      this.navigateCarousel('prev');
    });

    this.nextBtn.addEventListener('click', () => {
      this.navigateCarousel('next');
    });

    // Delete Record
    this.deleteBtn.addEventListener('click', () => {
      if (this.currentClaim) {
        this.handlers.onDelete(this.currentClaim.id);
      }
    });

    // Save Status Change (Manager)
    this.saveStatusBtn.addEventListener('click', () => {
      if (!this.currentClaim) return;
      const newStatus = this.statusSelect.value;
      const statusNote = this.commentInput.value.trim();
      
      this.handlers.onStatusChange(this.currentClaim.id, newStatus, statusNote);
      this.commentInput.value = ''; // Clear input
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.modal.style.display === 'flex') {
        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'ArrowLeft') {
          this.navigateCarousel('prev');
        } else if (e.key === 'ArrowRight') {
          this.navigateCarousel('next');
        }
      }
    });
  }

  open(claim, userRole) {
    this.currentClaim = claim;
    this.currentImageIdx = 0;

    // Shipment and status headers
    this.shipmentTitle.textContent = `Claim: ${claim.shipmentId}`;
    this.statusBadge.textContent = claim.status;
    
    // Set status badge color class
    this.statusBadge.className = 'status-badge';
    if (claim.status === 'Pending') this.statusBadge.classList.add('status-pending');
    else if (claim.status === 'Case Created') this.statusBadge.classList.add('status-case');
    else if (claim.status === 'Approved') this.statusBadge.classList.add('status-approved');
    else if (claim.status === 'Rejected') this.statusBadge.classList.add('status-rejected');

    // Values
    this.shipmentIdText.textContent = claim.shipmentId;
    this.trackingText.textContent = claim.trackingNumber;
    this.returnTypeText.textContent = claim.returnType || 'Amazon';
    this.issueText.textContent = claim.issueType;
    
    // Set actual reporter role details
    const roleText = claim.addedByRole === 'super' ? 'Manager' : 'Staff';
    this.reporterText.textContent = `${claim.addedBy || 'warehouse'} (${roleText})`;
    
    const dateFormatted = new Date(claim.dateAdded).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.dateText.textContent = dateFormatted;
    this.messageText.textContent = claim.message || 'No description comments provided.';

    // Images slider Setup
    this.updateImageSlider();

    // Timeline Rendering
    this.renderTimeline();

    // Check Roles for Manager Panel
    if (userRole === 'super') {
      this.managerPanel.style.display = 'block';
      this.deleteBtn.style.display = 'flex';
      this.statusSelect.value = claim.status;
    } else {
      this.managerPanel.style.display = 'none';
      this.deleteBtn.style.display = 'none';
    }

    this.modal.style.display = 'flex';

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateImageSlider() {
    const images = this.currentClaim.images || [];
    if (images.length === 0) {
      this.imgElement.src = '';
      this.imgElement.style.display = 'none';
      this.prevBtn.style.display = 'none';
      this.nextBtn.style.display = 'none';
      this.indicator.textContent = '0 / 0';
      return;
    }

    this.imgElement.style.display = 'block';
    this.imgElement.src = images[this.currentImageIdx];
    this.indicator.textContent = `${this.currentImageIdx + 1} / ${images.length}`;

    if (images.length > 1) {
      this.prevBtn.style.display = 'flex';
      this.nextBtn.style.display = 'flex';
    } else {
      this.prevBtn.style.display = 'none';
      this.nextBtn.style.display = 'none';
    }
  }

  navigateCarousel(direction) {
    const images = this.currentClaim.images || [];
    if (images.length <= 1) return;

    if (direction === 'prev') {
      this.currentImageIdx = (this.currentImageIdx - 1 + images.length) % images.length;
    } else {
      this.currentImageIdx = (this.currentImageIdx + 1) % images.length;
    }

    this.updateImageSlider();
  }

  renderTimeline() {
    this.timelineContainer.innerHTML = '';
    const history = this.currentClaim.history || [];

    // Order timeline descending (newest on top) or ascending (oldest on top)
    // Safe-T claims timeline is usually descending or ascending. Let's render chronologically ascending (first item on bottom)
    history.forEach((event, idx) => {
      const isLast = idx === history.length - 1;
      const activeClass = isLast ? 'active' : '';

      const timeFormatted = new Date(event.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const item = document.createElement('div');
      item.className = `timeline-item ${activeClass}`;
      item.innerHTML = `
        <div class="timeline-node"></div>
        <div class="timeline-header">
          <span class="timeline-title">${escapeHTML(event.status)}</span>
          <span class="timeline-date">${timeFormatted}</span>
        </div>
        <span class="timeline-user">By: ${escapeHTML(event.user)}</span>
        ${event.comment ? `<p class="timeline-desc">${escapeHTML(event.comment)}</p>` : ''}
      `;
      
      this.timelineContainer.prepend(item); // Prepend to show newest first!
    });
  }

  downloadEvidenceZip() {
    const claim = this.currentClaim;
    const images = claim.images || [];
    if (images.length === 0) {
      alert('No photo evidence to download.');
      return;
    }

    if (typeof JSZip === 'undefined') {
      alert('ZIP download library is still loading. Check your internet connection.');
      return;
    }

    const zip = new JSZip();
    const promises = [];

    images.forEach((imgSrc, index) => {
      if (imgSrc.startsWith('data:')) {
        const parts = imgSrc.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const extension = contentType.split('/')[1] || 'png';
        const base64Content = parts[1];
        zip.file(`evidence_photo_${index + 1}.${extension}`, base64Content, { base64: true });
      } else {
        // Fetch external mock URL image
        const promise = fetch(imgSrc)
          .then(response => {
            if (!response.ok) throw new Error('Network response error');
            return response.blob();
          })
          .then(blob => {
            const extension = blob.type.split('/')[1] || 'jpg';
            zip.file(`evidence_photo_${index + 1}.${extension}`, blob);
          })
          .catch(err => {
            console.warn(`Could not add external image to ZIP: ${imgSrc}`, err);
            // Fallback: save text link
            zip.file(`evidence_photo_${index + 1}_link.txt`, `Image URL: ${imgSrc}\nReason: Could not fetch due to browser CORS policies.`);
          });
        promises.push(promise);
      }
    });

    // Wait for all fetches (if any) to resolve
    Promise.all(promises).then(() => {
      zip.generateAsync({ type: 'blob' }).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `safet_claim_${claim.shipmentId}_photos.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 150);
      });
    }).catch(err => {
      alert('Failed to generate ZIP file: ' + err.message);
    });
  }

  downloadCurrentPhoto() {
    const claim = this.currentClaim;
    const images = claim.images || [];
    const currentSrc = images[this.currentImageIdx];
    if (!currentSrc) return;

    const a = document.createElement('a');
    a.href = currentSrc;

    let extension = 'png';
    if (currentSrc.startsWith('data:')) {
      const contentType = currentSrc.split(';base64,')[0].split(':')[1];
      extension = contentType.split('/')[1] || 'png';
    } else {
      const parts = currentSrc.split(/[#?]/)[0].split('.');
      if (parts.length > 1) {
        extension = parts[parts.length - 1];
      }
    }

    a.download = `safet_claim_${claim.shipmentId}_photo_${this.currentImageIdx + 1}.${extension}`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
    }, 150);
  }

  close() {
    this.modal.style.display = 'none';
    this.currentClaim = null;
  }
}
