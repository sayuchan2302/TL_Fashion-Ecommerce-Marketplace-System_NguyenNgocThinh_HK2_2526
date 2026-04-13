import VendorLayout from './VendorLayout';
import PanelPlaceholder from '../../components/Panel/PanelPlaceholder';

const VendorNotifications = () => {
  return (
    <VendorLayout title="Thông báo" breadcrumbs={['Kênh Người Bán', 'Thông báo']}>
      <PanelPlaceholder
        eyebrow="Notification Center"
        title="Thông báo cho người bán"
        description="Trang này dùng để chuẩn bị luồng thông báo realtime cho vendor. Màn hình hiện tại là placeholder để sẵn sàng gắn dữ liệu khi hoàn thiện backend event."
        bullets={[
          'Thông báo đơn mới và thay đổi trạng thái đơn',
          'Thông báo đổi trả, tranh chấp và yêu cầu xử lý',
          'Thông báo chương trình khuyến mãi từ sàn',
          'Thông báo đánh giá mới và phản hồi từ khách hàng',
        ]}
      />
    </VendorLayout>
  );
};

export default VendorNotifications;
