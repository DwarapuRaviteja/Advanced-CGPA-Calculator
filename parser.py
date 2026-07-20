from bs4 import BeautifulSoup


def clean(text):
    if text:
        return " ".join(text.split())
    return ""


def parse_semester_tables(html):

    soup = BeautifulSoup(html, "html.parser")

    semester_data = {}

    tables = soup.find_all("table")

    semester_number = 1

    for table in tables:

        rows = table.find_all("tr")

        if len(rows) < 2:
            continue

        subjects = []

        for row in rows:

            cols = row.find_all("td")

            if len(cols) < 6:
                continue

            code = clean(cols[1].get_text())
            name = clean(cols[2].get_text())
            grade = clean(cols[4].get_text())
            credits = clean(cols[5].get_text())

            if (
                code == ""
                or name == ""
                or credits == ""
                or grade == ""
            ):
                continue

            if grade.upper() in [
                "S", "A", "B", "C", "D", "E", "F"
            ]:

                subjects.append({
                    "code": code,
                    "name": name,
                    "credits": credits,
                    "grade": grade.upper()
                })

        if subjects:

            semester_data[f"Semester {semester_number}"] = subjects
            semester_number += 1

    return semester_data