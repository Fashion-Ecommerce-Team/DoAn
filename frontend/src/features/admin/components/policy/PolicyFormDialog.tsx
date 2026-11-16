'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@admin/components/ui/dialog';
import { Button } from '@admin/components/ui/button';
import { Input } from '@admin/components/ui/input';
import { Label } from '@admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@admin/components/ui/select';
import { PolicyDocumentRequest, PolicyDocumentResponse } from '../../types';
import { createPolicy, updatePolicy } from '../../services';
import { toast } from 'sonner';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface PolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: PolicyDocumentResponse | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'RETURN', label: 'Chính sách Đổi trả & Hoàn tiền' },
  { value: 'WARRANTY', label: 'Chính sách Bảo hành' },
  { value: 'SHIPPING', label: 'Chính sách Vận chuyển & Giao hàng' },
  { value: 'PAYMENT', label: 'Chính sách Thanh toán' },
  { value: 'GENERAL', label: 'Điều khoản chung & Bảo mật' },
];

export default function PolicyFormDialog({ open, onOpenChange, policy, onSuccess }: PolicyFormDialogProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('RETURN');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (policy) {
      setTitle(policy.title || '');
      setCategory(policy.category || 'RETURN');
      setContent(policy.content || '');
      setIsActive(policy.isActive !== false);
      setSelectedFile(null);
      setInputMode(policy.fileUrl ? 'file' : 'text');
    } else {
      setTitle('');
      setCategory('RETURN');
      setContent('');
      setIsActive(true);
      setSelectedFile(null);
      setInputMode('file');
    }
  }, [policy, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
        toast.error('Hệ thống chỉ hỗ trợ file .pdf, .docx, .txt, .md');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề chính sách');
      return;
    }

    if (inputMode === 'file' && !selectedFile && !policy) {
      toast.error('Vui lòng chọn file tài liệu (.pdf / .docx) để tải lên');
      return;
    }

    if (inputMode === 'text' && !content.trim()) {
      toast.error('Vui lòng nhập nội dung văn bản chính sách');
      return;
    }

    setSaving(true);
    try {
      const requestData: PolicyDocumentRequest = {
        title: title.trim(),
        category,
        content: inputMode === 'text' ? content.trim() : undefined,
        isActive,
      };

      if (policy) {
        await updatePolicy(policy.id, requestData, selectedFile);
        toast.success('Cập nhật chính sách thành công!');
      } else {
        await createPolicy(requestData, selectedFile);
        toast.success('Tạo chính sách và xử lý vector RAG thành công!');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || 'Lỗi khi lưu chính sách';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100">
        <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/70">
          <DialogTitle className="text-base font-bold text-slate-900">
            {policy ? 'Chỉnh sửa tài liệu chính sách' : 'Thêm mới tài liệu chính sách (RAG)'}
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Tài liệu sẽ được hệ thống bóc tách, tự động cắt đoạn (chunking) và sinh vector phục vụ Chatbot AI.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tiêu đề */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Tiêu đề chính sách <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chính sách đổi trả hàng và hoàn tiền năm 2026"
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          {/* Phân loại & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Danh mục chính sách</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Trạng thái hiệu lực</Label>
              <Select
                value={isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(v) => setIsActive(v === 'ACTIVE')}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs font-bold text-emerald-600">
                    Đang áp dụng (Active)
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs font-bold text-slate-500">
                    Tạm ẩn (Inactive)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chọn phương thức nhập */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Phương thức nạp nội dung</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  inputMode === 'file'
                    ? 'border-[#0099FF] bg-sky-50 text-[#0099FF] shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Tải file (.pdf, .docx)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  inputMode === 'text'
                    ? 'border-[#0099FF] bg-sky-50 text-[#0099FF] shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Gõ văn bản trực tiếp
              </button>
            </div>
          </div>

          {/* Chế độ tải file */}
          {inputMode === 'file' && (
            <div className="space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#0099FF] hover:bg-sky-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0099FF] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Bấm vào đây để chọn file tài liệu
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng PDF (.pdf), Word (.docx), Markdown (.md)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-bold text-emerald-900 truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-emerald-700 text-[11px]">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {policy?.fileName && !selectedFile && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>File hiện tại: <strong>{policy.fileName}</strong></span>
                  </div>
                  {policy.fileUrl && (
                    <a
                      href={policy.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0099FF] font-bold hover:underline"
                    >
                      Xem file gốc
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chế độ gõ văn bản trực tiếp */}
          {inputMode === 'text' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Nội dung văn bản chính sách <span className="text-rose-500">*</span>
              </Label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dán hoặc gõ nội dung chi tiết các điều khoản chính sách vào đây..."
                rows={8}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0099FF]/20 focus:border-[#0099FF] font-sans leading-relaxed"
                required={inputMode === 'text'}
              />
            </div>
          )}
        </form>

        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-xl font-bold text-xs"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl font-bold text-xs bg-[#0099FF] hover:bg-[#0088e6] text-white shadow-md shadow-[#0099FF]/20"
          >
            {saving ? 'Đang xử lý...' : policy ? 'Lưu thay đổi' : 'Tải lên & Tạo Vector'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
