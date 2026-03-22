export const CLIENT_DICTIONARY = {
  product: {
    color: 'Màu sắc',
    size: 'Kích cỡ',
    sizeGuide: 'Bảng kích cỡ',
    sold: 'Đã bán',
  },
  listing: {
    activeFilters: 'Đang lọc',
    clearAll: 'Xóa tất cả',
    resultsLabel: 'Hiển thị {start}-{end} trên tổng {total} sản phẩm',
    empty: 'Không tìm thấy sản phẩm phù hợp',
    breadcrumbs: {
      home: 'Trang Chủ',
      all: 'Danh mục',
    },
    header: {
      title: 'Sản phẩm',
      countSuffix: 'sản phẩm',
    },
    filters: {
      label: 'Bộ lọc',
      clearAll: 'Xóa tất cả',
      priceLabel: 'Khoảng giá',
      sizeLabel: 'Kích cỡ',
      colorLabel: 'Màu sắc',
    },
    chips: {
      size: 'Size: {value}',
    },
  },
  reviews: {
    countLabel: 'đánh giá',
    replyBadge: 'Phản hồi từ shop',
    title: 'Đánh giá sản phẩm',
    empty: 'Chưa có đánh giá nào cho sản phẩm này',
    form: {
      writeTitle: 'Viết đánh giá',
      editTitle: 'Chỉnh sửa đánh giá',
      yourRating: 'Đánh giá của bạn',
      titleLabel: 'Tiêu đề (tùy chọn)',
      titlePlaceholder: 'VD: Sản phẩm rất tốt, giao hàng nhanh...',
      contentLabel: 'Nội dung đánh giá',
      contentPlaceholder: 'Chia sẻ trải nghiệm của bạn về sản phẩm này...',
      contentRequired: '*',
      imageLabel: 'Thêm hình ảnh (tùy chọn)',
      addImage: 'Thêm ảnh',
      cancel: 'Hủy',
      submit: 'Gửi đánh giá',
      submitting: 'Đang gửi...',
      update: 'Cập nhật',
      ratingText: {
        5: 'Tuyệt vời!',
        4: 'Rất tốt',
        3: 'Bình thường',
        2: 'Không hài lòng',
        1: 'Rất kém',
        0: 'Chọn số sao',
      },
    },
  },
} as const;

export type ClientDictionary = typeof CLIENT_DICTIONARY;
