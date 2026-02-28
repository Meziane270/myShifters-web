// src/pages/admin/verifications/components/DocumentViewer.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Download, X, FileText, FileImage, ExternalLink } from "lucide-react";

export default function DocumentViewer({ document, isOpen, onClose }) {
    if (!document) return null;

    // Support both legacy base64 and new OCI URL format
    const fileUrl = document.url || null;
    const fileName = document.file?.filename || document.type || "Document";
    const mimeType = document.mime_type || document.file?.content_type || "";
    const isPDF = mimeType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");
    const isImage = mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const hasBase64 = document.file?.data_base64;
    const base64Src = hasBase64 ? `data:${mimeType};base64,${document.file.data_base64}` : null;
    const displaySrc = base64Src || fileUrl;

    const handleDownload = () => {
        if (base64Src) {
            const link = window.document.createElement("a");
            link.href = base64Src;
            link.download = fileName;
            link.click();
        } else if (fileUrl) {
            window.open(fileUrl, "_blank");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-foreground">
                        <div className="flex items-center gap-2">
                            {isPDF ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                            <span className="truncate max-w-[300px]">{fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="border-border" onClick={handleDownload}>
                                {fileUrl && !base64Src ? (
                                    <><ExternalLink className="w-4 h-4 mr-2" />Ouvrir</>
                                ) : (
                                    <><Download className="w-4 h-4 mr-2" />Télécharger</>
                                )}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4 bg-background rounded-lg overflow-hidden" style={{ maxHeight: "70vh" }}>
                    {displaySrc ? (
                        isPDF ? (
                            <iframe src={displaySrc} className="w-full h-full min-h-[500px]" title={fileName} />
                        ) : isImage ? (
                            <img src={displaySrc} alt={fileName} className="w-full h-auto max-h-[70vh] object-contain" />
                        ) : (
                            <div className="p-8 text-center text-foreground/70">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-foreground/30" />
                                <p>Aperçu non disponible pour ce type de fichier</p>
                                <Button variant="outline" className="mt-4 border-border" onClick={handleDownload}>
                                    Ouvrir le fichier
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className="p-8 text-center text-foreground/70">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-foreground/30" />
                            <p>Aucun fichier disponible</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}