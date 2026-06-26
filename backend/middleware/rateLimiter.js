const requests = new Map();

export default function rateLimiter(req, res, next) {

    const ip = req.ip;

    const now = Date.now();

    const limit = 60;

    const windowMs = 60000;

    if (!requests.has(ip)) {

        requests.set(ip, []);

    }

    const history = requests.get(ip).filter(
        t => now - t < windowMs
    );

    history.push(now);

    requests.set(ip, history);

    if (history.length > limit) {

        return res.status(429).json({

            success: false,

            message: "Too Many Requests"

        });

    }

    next();

}
