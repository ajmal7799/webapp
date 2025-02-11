const Order = require('../../models/orderSchema');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const excelJS = require('exceljs');



const loadSalesReport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const filtervalue = req.query.filtervalue || 'custom';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';

        let query = {
            orderStatus: 'delivered'
        };

        if (filtervalue !== 'custom') {
            const today = new Date();
            let start, end;

            switch (filtervalue) {
                case "daily":
                    start = new Date(today.setHours(0, 0, 0, 0));
                    end = new Date(today.setHours(23, 59, 59, 999));
                    break;
                case "weekly":
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    start = new Date(startOfWeek.setHours(0, 0, 0, 0));
                    end = new Date(startOfWeek.setDate(startOfWeek.getDate() + 6));
                    end.setHours(23, 59, 59, 999);
                    break;
                case "monthly":
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case "yearly":
                    start = new Date(today.getFullYear(), 0, 1);
                    end = new Date(today.getFullYear(), 11, 31);
                    end.setHours(23, 59, 59, 999);
                    break;
            }

            query.createdAt = { $gte: start, $lte: end };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }
        

        const totalOrders = await Order.find(query)
            .populate('userId')
            .populate('products.product')
            .sort({ createdAt: -1 });

        const totalSalesPrice = totalOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const saleCount = totalOrders.length;
        const couponDiscount = totalOrders.reduce((sum, order) => sum + order.discount, 0);
        // console.log('couponDiscount:', couponDiscount);

        const order = await Order.find(query)
            .populate('userId')
            .populate('products.product')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('salesreport', {
            order,
            totalSalesPrice: Math.round(totalSalesPrice),
            saleCount,
            couponDiscount,
            totalPage: Math.ceil(totalOrders.length / limit),
            page,
            filtervalue,
            startDate,
            endDate,
            currentFilters: req.query || {}
            
        });

    } catch (error) {
        console.error('Sales Report Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading sales report', 
            error: error.message 
        });
    }
};



const downloadSalesPDF = async (req, res) => {
    try {
        const { filtervalue, startDate, endDate } = req.query;
       

        let query = { orderStatus: 'delivered' };

        if (filtervalue !== 'custom') {
            const today = new Date();
            let start, end;

            switch (filtervalue) {
                case 'daily':
                    start = new Date(today.setHours(0, 0, 0, 0));
                    end = new Date(today.setHours(23, 59, 59, 999));
                    break;
                case 'weekly':
                    start = new Date(today);
                    start.setDate(today.getDate() - today.getDay());
                    end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'monthly':
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'yearly':
                    start = new Date(today.getFullYear(), 0, 1);
                    end = new Date(today.getFullYear(), 11, 31);
                    end.setHours(23, 59, 59, 999);
                    break;
            }

            query.createdAt = { $gte: start, $lte: end };
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(`${startDate}T00:00:00.000Z`),
                $lte: new Date(`${endDate}T23:59:59.999Z`)
            };
        }

        const orders = await Order.find(query)
            .populate('userId')
            .populate('products.product')
            .sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No sales data found for the selected period' });
        }

        const dir = path.join(__dirname, '..', 'public', 'downloads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `sales-report-${Date.now()}.pdf`;
        const filepath = path.join(dir, filename);

       
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        doc.fontSize(18).text('Sales Report', { align: 'center' }).moveDown();

      
        const totalSalesPrice = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const saleCount = orders.length;
        const couponDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);

        doc.fontSize(12)
            .text(`Total Orders: ${saleCount}`)
            .text(`Total Revenue: ₹${Math.round(totalSalesPrice)}`)
            .text(`Coupon Discounts: ₹${Math.round(couponDiscount)}`)
            .moveDown();

    
        doc.fontSize(10).font('Helvetica-Bold');
        const tableTop = doc.y;

        doc.text('Date', 50, tableTop)
            .text('User', 120, tableTop)
            .text('Product', 200, tableTop)
            .text('Quantity', 300, tableTop, { width: 50, align: 'right' })
            .text('Price', 350, tableTop, { width: 50, align: 'right' })
            .text('Total', 420, tableTop, { width: 50, align: 'right' });

        doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();

       
        doc.font('Helvetica').moveDown();
        orders.forEach(order => {
            order.products.forEach(item => {
                const y = doc.y;

                doc.text(new Date(order.createdAt).toLocaleDateString(), 50, y)
                    .text(order.userId?.firstname || 'N/A', 120, y)
                    .text(item.product?.name || 'N/A', 200, y)
                    .text(item.quantity.toString(), 300, y, { width: 50, align: 'right' })
                    .text(`₹${item.price}`, 350, y, { width: 50, align: 'right' })
                    .text(`₹${item.price * item.quantity - (item.discount || 0)}`, 420, y, { width: 50, align: 'right' });

                doc.moveDown();
            });
        });

        doc.end();

       
        stream.on('finish', () => {
            res.download(filepath, filename, err => {
                if (err) {
                    console.error('Download error:', err);
                    return res.status(500).json({ message: 'Error downloading PDF' });
                }

                
                fs.unlink(filepath, unlinkErr => {
                    if (unlinkErr) console.error('File deletion error:', unlinkErr);
                });
            });
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Error generating PDF' });
    }
};

const downloadExcel = async (req, res) => {
    try {
        const { salesData, filters } = req.body;
        console.log(salesData, filters);
        
        if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
            return res.status(400).json({ error: 'No data provided or invalid data format' });
        }

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

       
        if (filters) {
            worksheet.addRow(['Filter Type:', filters.filterValue || 'All']);
            worksheet.addRow(['Date Range:', `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`]);
            worksheet.addRow([]); 
        }

       
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'User', key: 'user', width: 20 },
            { header: 'Product', key: 'product', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Price (₹)', key: 'price', width: 15 },
            { header: 'Discount (₹)', key: 'discount', width: 15 },
            { header: 'Total (₹)', key: 'total', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 }
        ];

       
        const headerRow = worksheet.getRow(filters ? 4 : 1);
        headerRow.font = { bold: true };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        
        salesData.forEach(data => {
            worksheet.addRow(data);
        });

       
        const totalRow = worksheet.addRow({
            date: 'Total',
            quantity: salesData.reduce((sum, item) => sum + (item.quantity || 0), 0),
            price: salesData.reduce((sum, item) => sum + (item.price || 0), 0),
            discount: salesData.reduce((sum, item) => sum + (item.discount || 0), 0),
            total: salesData.reduce((sum, item) => sum + (item.total || 0), 0)
        });
        totalRow.font = { bold: true };

     
        ['price', 'discount', 'total'].forEach(col => {
            worksheet.getColumn(col).numFmt = '₹#,##0.00';
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).json({ error: error.message || 'Failed to generate Excel file' });
    }
};


module.exports = {
    loadSalesReport,
    downloadSalesPDF,
    downloadExcel,
   
}
