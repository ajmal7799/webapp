function cancelOrder(orderId) {
    Swal.fire({
        title: 'Cancel Order',
        text: 'Are you sure you want to cancel this order?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Cancel Order',
        cancelButtonText: 'No, Keep Order'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/cancel-order/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire('Cancelled!', 'Your order has been cancelled and wallet updated.', 'success')
                        .then(() => location.reload());
                } else {
                    Swal.fire('Error', data.message, 'error');
                }
            });
        }
    });
}

function initiateReturn(orderId, productId) {
    Swal.fire({
        title: 'Return Item',
        text: 'Are you sure you want to return this item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Return Item'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/return-order/${orderId}/${productId}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Returned!', data.message, 'success')
                            .then(() => location.reload());
                    } else {
                        Swal.fire('Error', data.error || 'Return failed', 'error');
                    }
                });
        }
    });
}
