document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const codeTextarea = document.getElementById('codeTextarea');
    const previewContainer = document.getElementById('previewContainer');
    const resultContainer = document.getElementById('resultContainer');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let currentFile = null;
    let inputMode = 'file'; // 'file' or 'code'
    
    // タブ切り替え機能
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // アクティブタブ切り替え
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // タブコンテンツ表示切り替え
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // 入力モード切り替え
            inputMode = tabId === 'file-upload' ? 'file' : 'code';
            
            // プレビューをクリア
            previewContainer.innerHTML = '';
            // ファイル選択情報を削除
            const existingInfo = document.querySelector('.selected-file-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            currentFile = null;
        });
    });
    
    // コード入力タイプ切り替え
    const codeTypeRadios = document.querySelectorAll('input[name="codeType"]');
    codeTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateCodePlaceholder();
        });
    });
    
    function updateCodePlaceholder() {
        const codeType = document.querySelector('input[name="codeType"]:checked').value;
        if (codeType === 'html') {
            codeTextarea.placeholder = 'ここにHTMLコードを貼り付けてください...';
        } else {
            codeTextarea.placeholder = 'ここにSVGコードを貼り付けてください...';
        }
    }
    
    // コード入力時のプレビュー
    codeTextarea.addEventListener('input', debounce(function() {
        if (inputMode === 'code') {
            previewCodeInput();
        }
    }, 500));
    
    function previewCodeInput() {
        const code = codeTextarea.value.trim();
        if (!code) {
            previewContainer.innerHTML = '';
            return;
        }
        
        const codeType = document.querySelector('input[name="codeType"]:checked').value;
        try {
            if (codeType === 'svg') {
                // SVGコードの場合はそのまま表示
                previewContainer.innerHTML = code;
                const svgElement = previewContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.setAttribute('width', svgElement.getAttribute('width') || '800');
                    svgElement.setAttribute('height', svgElement.getAttribute('height') || '600');
                    svgElement.style.maxWidth = '100%';
                    svgElement.style.height = 'auto';
                } else {
                    throw new Error('SVG要素が見つかりませんでした');
                }
            } else {
                // HTMLコードの場合はiframeで表示
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '400px';
                iframe.style.border = 'none';
                iframe.style.overflowY = 'visible';
                iframe.style.display = 'block';
                previewContainer.innerHTML = '';
                previewContainer.appendChild(iframe);
                
                setTimeout(() => {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(code);
                    iframeDoc.close();
                }, 100);
            }
        } catch (error) {
            previewContainer.innerHTML = `<p class="error-message">プレビューエラー: ${error.message}</p>`;
        }
    }
    
    // Handle file input
    fileInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;
        
        currentFile = file;
        previewFile(file);
        
        // ファイル名を表示
        const uploadWrapper = document.querySelector('.file-upload-wrapper');
        const fileInfo = document.createElement('div');
        fileInfo.className = 'selected-file-info';
        fileInfo.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} (${formatFileSize(file.size)})`;
        
        // 既存の選択ファイル情報を削除
        const existingInfo = uploadWrapper.querySelector('.selected-file-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        uploadWrapper.appendChild(fileInfo);
    });
    
    // ファイルサイズを適切な単位でフォーマット
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // ドラッグ&ドロップ機能の追加
    const dropArea = document.querySelector('.file-upload-wrapper');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
        // ドラッグ中はテキストを非表示にする
        const infoText = dropArea.querySelector('.file-upload-info');
        if (infoText) {
            infoText.style.opacity = '0.3';
        }
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
        // ドラッグ終了でテキストを元に戻す
        const infoText = dropArea.querySelector('.file-upload-info');
        if (infoText) {
            infoText.style.opacity = '1';
        }
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file) {
            fileInput.files = dt.files;
            currentFile = file;
            previewFile(file);
            
            // ファイル名を表示
            const uploadWrapper = document.querySelector('.file-upload-wrapper');
            const fileInfo = document.createElement('div');
            fileInfo.className = 'selected-file-info';
            fileInfo.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} (${formatFileSize(file.size)})`;
            
            // 既存の選択ファイル情報を削除
            const existingInfo = uploadWrapper.querySelector('.selected-file-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            
            uploadWrapper.appendChild(fileInfo);
        }
    }
    
    // Preview the uploaded file
    function previewFile(file) {
        const reader = new FileReader();
        
        reader.onload = function (e) {
            const fileContent = e.target.result;
            
            // Clear previous content
            previewContainer.innerHTML = '';
            
            if (file.name.endsWith('.svg')) {
                // For SVG files
                previewContainer.innerHTML = fileContent;
                const svgElement = previewContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.style.maxWidth = '100%';
                    svgElement.style.height = 'auto';
                }
            } else if (file.name.endsWith('.html')) {
                // For HTML files
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '400px';
                iframe.style.border = 'none';
                
                previewContainer.appendChild(iframe);
                
                // Use setTimeout to ensure iframe is in the DOM
                setTimeout(() => {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(fileContent);
                    iframeDoc.close();
                }, 100);
            }
        };
        
        if (file.name.endsWith('.svg') || file.name.endsWith('.html')) {
            reader.readAsText(file);
        } else {
            previewContainer.innerHTML = '<p class="error-message">HTMLまたはSVGファイルをアップロードしてください。</p>';
        }
    }