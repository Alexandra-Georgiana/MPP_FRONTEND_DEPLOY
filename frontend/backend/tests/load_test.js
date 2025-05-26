import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 }, // Ramp-up to 50 users over 30 seconds
        { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
        { duration: '30s', target: 0 },  // Ramp-down to 0 users over 30 seconds
    ],
};

export default function () {
    const res = http.get('http://localhost:5000/api/mostCommonGenre/3');
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time is < 200ms': (r) => r.timings.duration < 200,
    });
    sleep(1); // Simulate user think time

    // const res2 = http.get('http://localhost:5000/api/songs');
    // check(res2, {
    //     'status is 200': (r) => r.status === 200,
    //     'response time is < 200ms': (r) => r.timings.duration < 200,
    // });
    // sleep(1); // Simulate user think time
}