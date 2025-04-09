
const fs = require('fs');
const XmlStream = require('xml-stream');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const stream = fs.createReadStream('uploads/uploaded.xml');
const xml = new XmlStream(stream);

const csvWriter = createCsvWriter({
  path: 'output/output.csv',
  header: [
    { id: 'orderDate', title: 'Order Date' },
    { id: 'mfgName', title: 'MFG Name' },
    { id: 'orderId', title: 'Order ID' },
    { id: 'discountCode', title: 'Discount Code' },
    { id: 'audienceType', title: 'Audience Type' },
    { id: 'userEmail', title: 'User Email' },
    { id: 'discount', title: 'Discount' },
    { id: 'subTotal', title: 'Sub Total' },
    { id: 'tax', title: 'Tax' },
    { id: 'shipping', title: 'Shipping' },
    { id: 'total', title: 'Total' }
  ]
});

const mappedOrders = [];

xml.collect('price-adjustment');
xml.collect('product-lineitem');

xml.on('endElement: order', function (order) {
  const totals = order.totals || {};
  const merchTotal = totals['merchandize-total'] || {};
  const lineItems = order['product-lineitems'] && order['product-lineitems']['product-lineitem'];

  let adjustments = {};
  let foundCoupon = false;

  if (
    merchTotal['price-adjustments'] &&
    merchTotal['price-adjustments']['price-adjustment']
  ) {
    const pa = merchTotal['price-adjustments']['price-adjustment'];
    if (Array.isArray(pa)) {
      for (let i = 0; i < pa.length; i++) {
        if (pa[i]['coupon-id']) {
          adjustments = pa[i];
          foundCoupon = true;
          break;
        }
      }
      if (!foundCoupon && pa.length > 0) {
        adjustments = pa[0];
      }
    } else {
      adjustments = pa;
      if (pa['coupon-id']) foundCoupon = true;
    }
  }

  if (!foundCoupon && lineItems) {
    const items = Array.isArray(lineItems) ? lineItems : [lineItems];
    for (let i = 0; i < items.length; i++) {
      const itemAdjustments = items[i]['price-adjustments'] && items[i]['price-adjustments']['price-adjustment'];
      if (itemAdjustments) {
        const pa = Array.isArray(itemAdjustments) ? itemAdjustments : [itemAdjustments];
        for (let j = 0; j < pa.length; j++) {
          if (pa[j]['coupon-id']) {
            adjustments = pa[j];
            foundCoupon = true;
            break;
          }
        }
      }
      if (foundCoupon) break;
    }
  }

  mappedOrders.push({
    orderDate: order['order-date'] || null,
    mfgName: 'XTRATUF',
    orderId: order.$ && order.$['order-no'] ? order.$['order-no'] : null,
    discountCode: adjustments && adjustments['coupon-id'] ? adjustments['coupon-id'] : null,
    audienceType: 'Pro',
    userEmail:
      order.customer && order.customer['customer-email']
        ? order.customer['customer-email']
        : null,
    discount: adjustments && adjustments['net-price'] ? adjustments['net-price'] : null,
    subTotal:
      totals['adjusted-merchandize-total'] && totals['adjusted-merchandize-total']['net-price'] ? totals['adjusted-merchandize-total']['net-price'] : null,
    tax:
      totals['order-total'] && totals['order-total']['tax'] ? totals['order-total']['tax'] : null,
    shipping:
      totals['shipping-total'] && totals['shipping-total']['net-price'] ? totals['shipping-total']['net-price'] : null,
    total:
      totals['order-total'] && totals['order-total']['net-price'] ? totals['order-total']['net-price'] : null
  });
});

xml.on('end', function () {
  csvWriter.writeRecords(mappedOrders).then(function () {
    console.log('CSV file saved.');
  });
});
