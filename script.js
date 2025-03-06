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
    
    // Convert button click handler
    convertBtn.addEventListener('click', function () {
        if (inputMode === 'file' && !currentFile) {
            alert('まずファイルをアップロードしてください。');
            return;
        } else if (inputMode === 'code' && !codeTextarea.value.trim()) {
            alert('コードを入力してください。');
            return;
        }
        
        const format = document.querySelector('input[name="format"]:checked').value;
        
        if (inputMode === 'file') {
            convertFileToImage(format);
        } else {
            convertCodeToImage(format);
        }
    });
    
    // ファイルを画像に変換
    function convertFileToImage(format) {
        if (currentFile.name.endsWith('.svg')) {
            // For SVG, use the SVG element in the preview
            const svgElement = previewContainer.querySelector('svg');
            if (!svgElement) {
                showError('SVGエレメントが見つかりませんでした。');
                return;
            }
            
            // Create a canvas and draw the SVG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create a temporary image to draw the SVG
            const img = new Image();
            
            // Get SVG dimensions and viewBox
            // SVGのサイズを正確に取得
            let svgWidth = 800;
            let svgHeight = 600;
            
            // width/height属性から取得
            if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
                svgWidth = parseFloat(svgElement.getAttribute('width'));
                svgHeight = parseFloat(svgElement.getAttribute('height'));
            } 
            // viewBox属性から取得
            else if (svgElement.hasAttribute('viewBox')) {
                const viewBox = svgElement.getAttribute('viewBox').split(' ');
                if (viewBox.length === 4) {
                    svgWidth = parseFloat(viewBox[2]);
                    svgHeight = parseFloat(viewBox[3]);
                }
            }
            
            // SVG要素の属性を最適化
            if (!svgElement.getAttribute('width')) svgElement.setAttribute('width', svgWidth);
            if (!svgElement.getAttribute('height')) svgElement.setAttribute('height', svgHeight);
            
            // viewBoxがない場合は追加してスケーラビリティを改善
            if (!svgElement.getAttribute('viewBox')) {
                svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
                }
                
                // preserveAspectRatioを設定して比率保持を確実に
                if (!svgElement.getAttribute('preserveAspectRatio')) {
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
                
                // 品質を高めるためにSVGを大きめにスケール
                const scaleFactor = 2;
                svgElement.setAttribute('width', svgWidth * scaleFactor);
                svgElement.setAttribute('height', svgHeight * scaleFactor);
                
                // Create SVG blob with enhanced dimensions
                const svgBlob = new Blob([new XMLSerializer().serializeToString(svgElement)], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {
                // キャンバスを高解像度で設定
                const maxDimension = Math.max(svgWidth, svgHeight);
                let finalWidth = svgWidth;
                let finalHeight = svgHeight;
                
                // Canvasの品質向上のためのスケールファクター
                const canvasScaleFactor = 2; // キャンバスの解像度を向上
                
                // 余白を確保
                    const padding = 30; // 余白を増やしてクリッピングを防止
                    // 左右の余白のバランスを調整するためのオフセット
                    const offsetX = 50; // オフセットを増やして左右のバランスを改善
                
                // Ensure minimum size (prevent tiny images)
                if (finalWidth < 300) {
                    const ratio = finalHeight / finalWidth;
                    finalWidth = 300;
                    finalHeight = finalWidth * ratio;
                }
                
                if (finalHeight < 300) {
                    const ratio = finalWidth / finalHeight;
                    finalHeight = 300;
                    finalWidth = finalHeight * ratio;
                }
                
                // 高解像度のためにキャンバスサイズをスケーリング
                canvas.width = (finalWidth + (padding * 2) + offsetX) * canvasScaleFactor;
                canvas.height = (finalHeight + (padding * 2)) * canvasScaleFactor;
                
                // キャンバスの品質設定を最適化
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // 大きめのキャンバスに合わせてスケーリングするためにコンテキストを変換
                ctx.scale(canvasScaleFactor, canvasScaleFactor);
                
                // 白い背景を描画
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width / canvasScaleFactor, canvas.height / canvasScaleFactor);
                
                // 適切なパディングとスケーリングで画像をキャンバスに描画
                const horizontalPadding = padding + 30; // 左右のバランスを改善するために余白を追加
                ctx.drawImage(img, horizontalPadding, padding, finalWidth, finalHeight);
                
                // 画質を最大にして画像に変換
                const dataUrl = canvas.toDataURL(`image/${format}`, 1.0); // 画質を1.0に向上
                displayResult(dataUrl, format);
                
                // Clean up
                URL.revokeObjectURL(url);
            };
            
            img.onerror = function() {
                showError('SVGの読み込み中にエラーが発生しました。');
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
            
        } else if (currentFile.name.endsWith('.html')) {
            // For HTML, use html2canvas on the iframe content
            const iframe = previewContainer.querySelector('iframe');
            if (!iframe) {
                showError('HTMLコンテンツが見つかりませんでした。');
                return;
            }
            
            // Ensure iframe content is fully loaded
            setTimeout(() => {
                const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                const iframeBody = iframeDocument.body;
                
                // Get iframe dimensions
                // 実際のコンテンツの高さとスクロール高さの大きい方を取得
                const bodyWidth = iframeBody.scrollWidth;
                    const bodyHeight = Math.max(iframeBody.scrollHeight, iframeBody.offsetHeight) + 100; // 下部に余裕を持たせる
                
                // Set iframe dimensions to ensure content is fully visible
                iframe.style.width = (bodyWidth + 40) + 'px';
                iframe.style.height = (bodyHeight + 200) + 'px'; // 下部により多くの余裕を確保
                
                // コンテンツが切れないようにiframeのコンテンツスタイルを調整
                try {
                    const iframeStyles = iframeDocument.createElement('style');
                    iframeStyles.textContent = `
                        body { 
                            margin-bottom: 200px !important; 
                            padding-bottom: 200px !important; 
                            height: auto !important; 
                            overflow-y: visible !important; 
                            padding-left: 20px !important; /* 左側に余白を追加 */
                        }
                        table { margin-left: 20px !important; } /* テーブルを左にオフセット */
                        td:first-child { padding-left: 20px !important; } /* 最初の列に余白を追加 */
                    `;
                    iframeDocument.head.appendChild(iframeStyles);
                } catch (e) {
                    console.error('スタイルの追加に失敗しました:', e);
                }
                
                html2canvas(iframeBody, {
                    allowTaint: true,
                    useCORS: true,
                    scale: 4, // 解像度を2倍→4倍に増加
                    width: bodyWidth,
                    height: bodyHeight,
                    windowWidth: bodyWidth,
                    windowHeight: bodyHeight,
                    x: -40, // 左マージンをさらに広げて調整
                    y: -20, // 上マージンを追加
                    backgroundColor: '#ffffff', // 白い背景を確保
                    padding: [60, 40, 40, 40], // 左側のパディングを特に増やす
                    logging: true, // デバッグのためのロギングを有効化
                    onclone: function(clonedDoc) {
                        // クローンされたドキュメントの高さを強制的に確保
                        const clonedBody = clonedDoc.body;
                        if (clonedBody) {
                            clonedBody.style.height = (bodyHeight + 100) + 'px';
                            clonedBody.style.overflowY = 'visible';
                            clonedBody.style.marginBottom = '100px';
                        }
                    }
                }).then(canvas => {
                    const dataUrl = canvas.toDataURL(`image/${format}`, 1.0); // 画質を0.9→1.0に向上
                    displayResult(dataUrl, format);
                }).catch(error => {
                    showError('変換中にエラーが発生しました: ' + error.message);
                });
            }, 500); // Give iframe time to fully render
        }
    }
    
    // コードを画像に変換
    function convertCodeToImage(format) {
        const code = codeTextarea.value.trim();
        const codeType = document.querySelector('input[name="codeType"]:checked').value;
        
        if (codeType === 'svg') {
            try {
                // SVGコードをパース
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(code, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');
                
                if (!svgElement) {
                    throw new Error('SVG要素が見つかりません。有効なSVGコードを入力してください。');
                }
                
                // エラーチェック
                const errorNode = svgDoc.querySelector('parsererror');
                if (errorNode) {
                    throw new Error('SVGの解析エラー: ' + errorNode.textContent);
                }
                
                // Canvasを使用してSVGを画像に変換
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // SVGのサイズを正確に取得
                let svgWidth = 800;
                let svgHeight = 600;
            
            // width/height属性から取得
            if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
                svgWidth = parseFloat(svgElement.getAttribute('width'));
                svgHeight = parseFloat(svgElement.getAttribute('height'));
            } 
            // viewBox属性から取得
            else if (svgElement.hasAttribute('viewBox')) {
                const viewBox = svgElement.getAttribute('viewBox').split(' ');
                if (viewBox.length === 4) {
                    svgWidth = parseFloat(viewBox[2]);
                    svgHeight = parseFloat(viewBox[3]);
                }
            }
                
                // SVG要素の属性を最適化
                if (!svgElement.getAttribute('width')) svgElement.setAttribute('width', svgWidth);
                if (!svgElement.getAttribute('height')) svgElement.setAttribute('height', svgHeight);
                
                // viewBoxがない場合は追加してスケーラビリティを改善
                if (!svgElement.getAttribute('viewBox')) {
                    svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
                }
                
                // preserveAspectRatioを設定して比率保持を確実に
                if (!svgElement.getAttribute('preserveAspectRatio')) {
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
                
                // 品質を高めるためにSVGを大きめにスケール
                const scaleFactor = 2;
                svgElement.setAttribute('width', svgWidth * scaleFactor);
                svgElement.setAttribute('height', svgHeight * scaleFactor);
                
                // Create SVG blob with enhanced dimensions
                const svgBlob = new Blob([new XMLSerializer().serializeToString(svgElement)], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = function() {
                    // キャンバスを大きめに設定して高解像度を確保
                    // 元のサイズに対してスケールファクターを適用
                    let finalWidth = svgWidth;
                    let finalHeight = svgHeight;
                    
                    // Canvasの品質向上のためのスケールファクター
                    const canvasScaleFactor = 2; // キャンバスの解像度を向上
                    
                    // 余白を確保
                    const padding = 30; // 余白を増やしてクリッピングを防止
                    // 左右の余白のバランスを調整するためのオフセット
                    const offsetX = 50; // オフセットを増やして左右のバランスを改善
                    
                    // Ensure minimum size (prevent tiny images)
                    if (finalWidth < 300) {
                        const ratio = finalHeight / finalWidth;
                        finalWidth = 300;
                        finalHeight = finalWidth * ratio;
                    }
                    
                    if (finalHeight < 300) {
                        const ratio = finalWidth / finalHeight;
                        finalHeight = 300;
                        finalWidth = finalHeight * ratio;
                    }
                    
                    // 高解像度のためにキャンバスサイズをスケーリング
                    canvas.width = (finalWidth + (padding * 2) + offsetX) * canvasScaleFactor;
                    canvas.height = (finalHeight + (padding * 2)) * canvasScaleFactor;
                    
                    // キャンバスの品質設定を最適化
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 大きめのキャンバスに合わせてスケーリングするためにコンテキストを変換
                    ctx.scale(canvasScaleFactor, canvasScaleFactor);
                    
                    // 白い背景を描画
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width / canvasScaleFactor, canvas.height / canvasScaleFactor);
                    
                    // 適切なパディングとスケーリングで画像をキャンバスに描画
                    const horizontalPadding = padding + 30; // 左右のバランスを改善するために余白を追加
                    ctx.drawImage(img, horizontalPadding, padding, finalWidth, finalHeight);
                    
                    // Convert to image and display
                    const dataUrl = canvas.toDataURL(`image/${format}`, 1.0); // 画質を0.9→1.0に向上
                    displayResult(dataUrl, format);
                    
                    // Clean up
                    URL.revokeObjectURL(url);
                };
                
                img.onerror = function() {
                    showError('SVGのレンダリング中にエラーが発生しました。');
                    URL.revokeObjectURL(url);
                };
                
                img.src = url;
                
            } catch (error) {
                showError('変換エラー: ' + error.message);
            }
        } else { // HTMLコードの場合
            try {
                // 一時的なiframeを作成してHTMLをレンダリング
                const iframe = document.createElement('iframe');
                iframe.style.position = 'absolute';
                iframe.style.top = '-9999px';
                iframe.style.left = '-9999px';
                iframe.style.width = '1000px'; // 大きめに設定して内容が切れないように
                iframe.style.height = '2000px'; // より大きな高さを確保
                iframe.style.overflowY = 'visible';
                iframe.style.display = 'block';
                document.body.appendChild(iframe);
                
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(code);
                iframeDoc.close();
                
                // HTMLのレンダリング完了を待つ
                setTimeout(() => {
                    const iframeBody = iframeDoc.body;
                    
                    // 実際のコンテンツサイズを取得
                    // 実際のコンテンツの高さとスクロール高さの大きい方を取得
                    const bodyWidth = iframeBody.scrollWidth;
                    const bodyHeight = Math.max(iframeBody.scrollHeight, iframeBody.offsetHeight) + 100; // 下部に余裕を持たせる
                    
                    // iframeサイズを調整
                    iframe.style.width = (bodyWidth + 40) + 'px';
                    iframe.style.height = (bodyHeight + 200) + 'px'; // 下部により多くの余裕を確保
                    
                    // コンテンツが切れないようにiframeのコンテンツスタイルを調整
                    try {
                        const iframeStyles = iframeDoc.createElement('style');
                        iframeStyles.textContent = `
                            body { 
                                margin-bottom: 200px !important; 
                                padding-bottom: 200px !important; 
                                height: auto !important; 
                                overflow-y: visible !important; 
                                padding-left: 20px !important; /* 左側に余白を追加 */
                            }
                            table { margin-left: 20px !important; } /* テーブルを左にオフセット */
                            td:first-child { padding-left: 20px !important; } /* 最初の列に余白を追加 */
                        `;
                        iframeDoc.head.appendChild(iframeStyles);
                    } catch (e) {
                        console.error('スタイルの追加に失敗しました:', e);
                    }
                    
                    // さらにレンダリング時間を与える
                    setTimeout(() => {
                        html2canvas(iframeBody, {
                            allowTaint: true,
                            useCORS: true,
                            scale: 4, // 解像度を2倍→4倍に増加
                            width: bodyWidth,
                            height: bodyHeight,
                            windowWidth: bodyWidth,
                            windowHeight: bodyHeight,
                            x: -40, // 左マージンをさらに広げて調整
                            y: -20, // 上マージンを追加
                            backgroundColor: '#ffffff', // 白い背景を確保
                            padding: [60, 40, 40, 40], // 左側のパディングを特に増やす
                            logging: true, // デバッグのためのロギングを有効化
                            onclone: function(clonedDoc) {
                                // クローンされたドキュメントの高さを強制的に確保
                                const clonedBody = clonedDoc.body;
                                if (clonedBody) {
                                    clonedBody.style.height = (bodyHeight + 100) + 'px';
                                    clonedBody.style.overflowY = 'visible';
                                    clonedBody.style.marginBottom = '100px';
                                }
                            }
                        }).then(canvas => {
                            const dataUrl = canvas.toDataURL(`image/${format}`, 1.0); // 画質を0.9→1.0に向上
                            displayResult(dataUrl, format);
                            // iframeを削除
                            document.body.removeChild(iframe);
                        }).catch(error => {
                            showError('HTMLのレンダリング中にエラーが発生しました: ' + error.message);
                            document.body.removeChild(iframe);
                        });
                    }, 300);
                }, 500);
            } catch (error) {
                showError('変換エラー: ' + error.message);
            }
        }
    }
    
    // Display the result
    function displayResult(dataUrl, format) {
        resultContainer.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = dataUrl;
        
        resultContainer.appendChild(img);
        
        // Enable download
        downloadBtn.href = dataUrl;
        downloadBtn.download = `converted-image.${format}`;
        downloadBtn.style.display = 'inline-block';
        
        // Scroll to result section
        downloadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Show error message
    function showError(message) {
        resultContainer.innerHTML = `<p class="error-message">${message}</p>`;
        downloadBtn.style.display = 'none';
    }
    
    // Helper function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});
