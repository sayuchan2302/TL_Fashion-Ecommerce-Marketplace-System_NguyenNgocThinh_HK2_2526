package vn.edu.hcmuaf.fit.fashionstore.seeder;

import vn.edu.hcmuaf.fit.fashionstore.entity.Product;
import vn.edu.hcmuaf.fit.fashionstore.entity.ProductVariant;

public record SeederCartLine(Product product, ProductVariant variant, int quantity) {
}
