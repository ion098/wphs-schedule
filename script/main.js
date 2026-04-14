'use strict';

const md_string = (date) => `${date.getMonth() + 1}/${date.getDate()}`;

const time_str_to_min = (time_str) => {
    const [hour, min] = time_str.split(":").map((str) => Number(str));
    /* Times between 12:00 - 6:00 are treated as PM, 
    all other time are treated as AM. */
    return min + 60 * (hour % 12) + ((hour % 12 <= 6) ? 12 * 60 : 0);
};

const html = (strings, ...values) =>
    strings.reduce((acc, str, i) => {
        return acc + str + (values[i] ?? '');
    }, '');

const date_template = (name, start, end) => {
    const time_start = time_str_to_min(start);
    const time_end = time_str_to_min(end);
    return html`<p class="date" data-start="${time_start}" data-end="${time_end}"><b>${name}</b> <span>${start} - ${end}</span></p>`;
};

const two_lunch_template = (header, first_lunch_times, second_lunch_times) => html`
    <article>
        <header>
            <h2>${header}</h2>
        </header>
        <div class="placeholder">
            <article class="lunch-1">
                <h3>1st Lunch</h3>
                ${first_lunch_times.map(([name, start, end]) => date_template(name, start, end)).join("")}
            </article>
            <article class="lunch-2">
                <h3>2nd Lunch</h3>
                ${second_lunch_times.map(([name, start, end]) => date_template(name, start, end)).join("")}
            </article>
        </div>
    </article>
`;

const one_lunch_template = (header, times) => html`
    <article>
        <header>
            <h2>${header}</h2>
        </header>
        <div>
            ${times.map(([name, start, end]) => date_template(name, start, end)).join("")}
        </div>
    </article>
`;

const all_schedules = [
    {
        selector_func: (day = (new Date()).getDay()) => (day === 0 || day === 6),
        template: html`
            <article>
                <header>
                    <h2>Weekends</h2>
                </header>
                <div>
                    No school today!
                </div>
            </article>
        `
    },
    {
        selector_func: (day = (new Date()).getDay()) => (day === 1 || day === 5),
        template: two_lunch_template("Mondays / Fridays", [
            ["Period 1:", "8:30", "9:59"],
            ["Period 2:", "10:07", "11:36"],
            ["Lunch:", "11:36", "12:06"],
            ["Period 3:", "12:14", "1:43"],
            ["Period 4:", "1:51", "3:20"]
        ], [
            ["Period 1:", "8:30", "9:59"],
            ["Period 2:", "10:07", "11:36"],
            ["Period 3:", "11:44", "1:13"],
            ["Lunch:", "1:13", "1:43"],
            ["Period 4:", "1:51", "3:20"]
        ])
    },
    {
        selector_func: (day = (new Date()).getDay()) => (day === 2 || day === 4),
        template: two_lunch_template("Tuesdays / Thursdays", [
            ["Period 1:", "8:30", "9:55"],
            ["Period 2:", "10:03", "11:44"],
            ["Lunch:", "11:44", "12:14"],
            ["Period 3:", "12:22", "1:47"],
            ["Period 4:", "1:55", "3:20"]

        ], [
            ["Period 1:", "8:30", "9:55"],
            ["Period 2:", "10:03", "11:44"],
            ["Period 3:", "11:52", "1:17"],
            ["Lunch:", "1:17", "1:47"],
            ["Period 4:", "1:55", "3:20"]
        ])
    },
    {
        selector_func: (day = (new Date()).getDay()) => (day === 3),
        template: two_lunch_template("Wednesdays", [
            ["Period 1:", "9:30", "10:44"],
            ["Period 2:", "10:52", "12:06"],
            ["Lunch:", "12:06", "12:36"],
            ["Period 3:", "12:44", "1:58"],
            ["Period 4:", "2:06", "3:20"]
        ], [
            ["Period 1:", "9:30", "10:44"],
            ["Period 2:", "10:52", "12:06"],
            ["Period 3:", "12:14", "1:28"],
            ["Lunch:", "1:28", "1:58"],
            ["Period 4:", "2:06", "3:20"]
        ])
    },
    {
        selector_func: () => (["10/9", "12/19", "3/12", "5/28"].includes(md_string(new Date()))),
        template: one_lunch_template("Midterms/Finals (Periods 1/2)", [
            ["Period 1:", "8:30", "10:30"],
            ["Break:", "10:30", "10:42"],
            ["Period 2:", "10:50", "12:50"]
        ])
    },
    {
        selector_func: () => (["10/10", "12/18", "3/13", "5/27"].includes(md_string(new Date()))),
        template: one_lunch_template("Midterms/Finals (Periods 3/4)", [
            ["Period 3:", "8:30", "10:30"],
            ["Break:", "10:30", "10:42"],
            ["Period 4:", "10:50", "12:50"]
        ])
    },
    {
        selector_func: () => (["10/8", "12/17", "3/11"].includes(md_string(new Date()))),
        template: two_lunch_template("Wednesday Full Day", [
            ["Period 1:", "8:30", "9:59"],
            ["Period 2:", "10:07", "11:36"],
            ["Lunch:", "11:36", "12:06"],
            ["Period 3:", "12:14", "1:43"],
            ["Period 4:", "1:51", "3:20"]
        ], [
            ["Period 1:", "8:30", "9:59"],
            ["Period 2:", "10:07", "11:36"],
            ["Period 3:", "11:44", "1:13"],
            ["Lunch:", "1:13", "1:43"],
            ["Period 4:", "1:51", "3:20"]
        ])
    },
    {
        selector_func: () => (["8/7", "10/30", "1/26"].includes(md_string(new Date()))),
        template: one_lunch_template("Extended 1-lunch", [
            ["Period 1:", "8:30", "9:55"],
            ["Period 2:", "10:03", "11:28"],
            ["Lunch:", "11:28", "12:14"],
            ["Period 3:", "12:22", "1:47"],
            ["Period 4:", "1:55", "3:20"]
        ])
    },
    {
        selector_func: () => (["8/8", "1/30", "5/22"].includes(md_string(new Date()))),
        template: one_lunch_template("Rally", [
            ["Period 1:", "8:30", "9:49"],
            ["Period 2:", "9:57", "11:16"],
            ["Lunch:", "11:16", "11:46"],
            ["Period 3:", "11:54", "1:13"],
            ["Rally:", "1:13", "1:48"],
            ["Period 4:", "2:01", "3:20"]
        ])
    },
    {
        selector_func: () => (["8/14", "1/12"].includes(md_string(new Date()))),
        template: one_lunch_template("Minimum Day", [
            ["Period 1:", "8:30", "9:26"],
            ["Period 2:", "9:34", "10:30"],
            ["Period 3:", "10:38", "11:34"],
            ["Lunch / Break:", "11:34", "11:46"],
            ["Period 4:", "11:54", "12:50"]
        ])
    },
    {
        selector_func: () => (["4/13", "4/14", "4/16", "4/17"].includes(md_string(new Date()))),
        template: two_lunch_template("CAASPP Testing", [
            ["Period 1:", "8:30", "9:35"],
            ["Testing:", "9:43", "11:11"],
            ["Period 2:", "11:19", "12:24"],
            ["Lunch:", "12:32", "1:02"],
            ["Period 3:", "1:02", "2:07"],
            ["Period 4:", "2:15", "3:20"]
        ], [
            ["Period 1:", "8:30", "9:35"],
            ["Testing:", "9:43", "11:11"],
            ["Period 2:", "11:19", "12:24"],
            ["Period 3:", "12:32", "1:37"],
            ["Lunch:", "1:37", "2:07"],
            ["Period 4:", "2:15", "3:20"]
        ])
    },
];

const main = () => {
    const find_highlight = () => {
        const now = new Date();
        let midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);
        const min_since_midnight = Math.floor((now - midnight) / 60000);

        document.querySelectorAll("#current-sched .date").forEach((el) => {
            const time_start = +el.getAttribute("data-start");
            const time_end = +el.getAttribute("data-end");
            if (time_start <= min_since_midnight && min_since_midnight < time_end) {
                el.classList.add("highlight");
                el.setAttribute("data-time-to-end", time_end - min_since_midnight);
            } else {
                el.classList.remove("highlight");
            }
        });
    };

    ["select-lunch-both", "select-lunch-1", "select-lunch-2"].forEach((id) => {
        document.getElementById(id).addEventListener("click", () => {
            window.localStorage.setItem("lunch-type", id);
        });
    });

    const prev_select = window.localStorage.getItem("lunch-type");
    if (prev_select) {
        document.getElementById(prev_select)["checked"] = true;
    }

    const current_schedule = all_schedules.findLast((schedule) => schedule.selector_func());

    document.querySelector("main").innerHTML = html`
        <div id="current-sched">
            ${current_schedule.template.replace(`class="placeholder"`, `class="grid"`)}
        </div>
        <hr>
        <h2>All Schedules</h2>
        <div class="grid-container">
            ${all_schedules.map((schedule) => schedule.template).join("")}
        </div>
    `;

    find_highlight();
    setInterval(find_highlight, 1000 * 60);
};

navigator.serviceWorker.register(new URL('/service_worker.js', import.meta.url), { scope: "/" });
main();
