// ClaimFormModal component for SafeTClaim

export class ClaimFormModal {
  constructor(handlers) {
    this.modal = document.getElementById('claim-form-modal');
    this.form = document.getElementById('claim-upload-form');
    this.titleText = document.getElementById('claim-form-title');
    this.formClaimId = document.getElementById('form-claim-id');

    // Form Fields
    this.shipmentIdInput = document.getElementById('form-shipment-id');
    this.trackingInput = document.getElementById('form-tracking');
    this.returnTypeSelect = document.getElementById('form-return-type');
    this.issueSelect = document.getElementById('form-issue-type');
    this.messageText = document.getElementById('form-message');
    
    // File inputs
    this.fileDropzone = document.getElementById('upload-dropzone');
    this.fileInput = document.getElementById('form-claim-files');
    this.previewGrid = document.getElementById('multi-preview-grid');

    this.handlers = handlers; // { onSubmit }

    this.uploadedImages = []; // Array of base64 strings

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

    // File Input Triggers
    this.fileDropzone.addEventListener('click', () => this.fileInput.click());
    
    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      this.fileDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fileDropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.fileDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.fileDropzone.classList.remove('dragover');
      }, false);
    });

    this.fileDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length > 0) {
        this.handleFileSelect(dt.files);
      }
    });

    // Form Submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const shipmentId = this.shipmentIdInput.value.trim().toUpperCase();
      const tracking = this.trackingInput.value.trim();
      const returnType = this.returnTypeSelect.value;
      const issueType = this.issueSelect.value;
      const message = this.messageText.value.trim();

      if (this.uploadedImages.length === 0) {
        alert('Please upload at least one photo showing the claim evidence.');
        return;
      }

      const claimData = {
        id: this.formClaimId.value || null,
        shipmentId,
        trackingNumber: tracking,
        returnType,
        issueType,
        images: [...this.uploadedImages],
        message
      };

      this.handlers.onSubmit(claimData);
      this.close();
    });
  }

  async handleFileSelect(files) {
    if (!files || files.length === 0) return;

    // Load each file and convert to base64
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.match('image.*')) {
        alert(`File "${file.name}" is not an image. Only photo files are accepted.`);
        continue;
      }

      try {
        const base64 = await this.fileToBase64(file);
        this.uploadedImages.push(base64);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    // Reset input value so same files can be selected again
    this.fileInput.value = '';
    this.renderPreviews();
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e.target.error);
      reader.readAsDataURL(file);
    });
  }

  renderPreviews() {
    this.previewGrid.innerHTML = '';
    
    this.uploadedImages.forEach((imgSrc, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'preview-thumb-container';
      thumb.innerHTML = `
        <img src="${imgSrc}" alt="Evidence Thumbnail">
        <button type="button" class="thumb-remove-btn" data-index="${idx}" title="Remove photo">&times;</button>
      `;
      
      thumb.querySelector('.thumb-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.uploadedImages.splice(idx, 1);
        this.renderPreviews();
      });

      this.previewGrid.appendChild(thumb);
    });
  }

  open(claimToEdit = null) {
    // Reset Form fields
    this.form.reset();
    this.formClaimId.value = '';
    this.uploadedImages = [];
    this.previewGrid.innerHTML = '';
    this.returnTypeSelect.value = '';

    if (claimToEdit) {
      // Edit Claim (rare but supported)
      this.titleText.textContent = 'Edit Claim Record';
      this.formClaimId.value = claimToEdit.id;
      this.shipmentIdInput.value = claimToEdit.shipmentId;
      this.trackingInput.value = claimToEdit.trackingNumber;
      this.returnTypeSelect.value = claimToEdit.returnType || '';
      this.issueSelect.value = claimToEdit.issueType;
      this.messageText.value = claimToEdit.message || '';
      
      this.uploadedImages = [...(claimToEdit.images || [])];
      this.renderPreviews();
    } else {
      // Add Claim
      this.titleText.textContent = 'Add Shipment Claim Record';
    }

    this.modal.style.display = 'flex';
    this.shipmentIdInput.focus();
  }

  close() {
    this.modal.style.display = 'none';
  }
}
