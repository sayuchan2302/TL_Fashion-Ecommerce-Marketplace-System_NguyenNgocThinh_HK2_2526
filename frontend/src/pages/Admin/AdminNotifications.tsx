import AdminLayout from './AdminLayout';
import PanelPlaceholder from '../../components/Panel/PanelPlaceholder';

const AdminNotifications = () => {
  return (
    <AdminLayout title="Thông báo" breadcrumbs={['Thông báo', 'Chuẩn bị hệ thống thông báo admin']}>
      <PanelPlaceholder
        eyebrow="Notification Center"
        title="Thông báo cho vai trò Admin"
        description="Khu vực này sẽ là trung tâm thông báo realtime cho admin. Tạm thời giữ bản placeholder để sẵn sàng nối pipeline nghiệp vụ ở phase tiếp theo."
        bullets={[
          'Thông báo vận hành toàn sàn theo mức ưu tiên',
          'Thông báo kiểm duyệt: gian hàng, sản phẩm, đánh giá',
          'Thông báo tài chính, đối soát và cảnh báo bất thường',
          'Đồng bộ unread badge giữa dropdown, trang danh sách và websocket',
        ]}
      />
    </AdminLayout>
  );
};

export default AdminNotifications;
