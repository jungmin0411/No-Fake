export default function QRScanCard({ onCameraScan, onImageUpload }) {
  return (
    <div className="participate-card qr-card">
      <div className="participate-card-header">
        <h3>QR 코드 스캔</h3>
      </div>

      <div className="qr-card-body">
        <div className="qr-placeholder">
          <span>QR</span>
        </div>

        <p className="qr-card-title">이벤트 QR 코드를 스캔하여 참여하세요</p>
        <p className="qr-card-desc">
          오프라인 이벤트장에서 QR 코드를 스캔하면 참여할 수 있습니다.
        </p>

        <div className="qr-card-actions">
          <button type="button" className="primary-btn" onClick={onCameraScan}>
            카메라로 스캔
          </button>

          <button type="button" className="secondary-btn" onClick={onImageUpload}>
            이미지 업로드
          </button>
        </div>
      </div>
    </div>
  );
}