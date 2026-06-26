export function success(res, data = {}, message = "OK") {

    return res.json({

        success: true,

        message,

        data

    });

}

export function failure(res, message = "Error", status = 500) {

    return res.status(status).json({

        success: false,

        message

    });

}
