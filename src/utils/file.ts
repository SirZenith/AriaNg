export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to load file'));
        reader.readAsText(file);
    });
}

export function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.replace(/.*?base64,/, ''));
        };

        reader.onerror = () => reject(new Error('Failed to load file'));
        reader.readAsDataURL(file);
    });
}

export function downloadFile(content: string, fileName?: string, contentType = 'application/octet-stream'): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');

    element.href = url;
    element.style.display = 'none';

    if (fileName) {
        element.download = fileName;
    }

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
}
