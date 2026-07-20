from playwright.sync_api import sync_playwright, TimeoutError
from bs4 import BeautifulSoup

LOGIN_URL = "https://sis.idealtech.edu.in/student/index.php"


def fetch_student_results(
    username,
    password,
    email,
    phone,
    progress=None
):

    def update(message):
        if progress:
            progress(message)

    html = ""

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True,      # Change to False while developing if needed
            slow_mo=300
        )

        page = browser.new_page(
            viewport={"width": 1366, "height": 768}
        )

        page.set_default_timeout(60000)

        try:

            # -----------------------------
            # Open Login Page
            # -----------------------------
            update("Opening Login Page...")

            page.goto(
                LOGIN_URL,
                wait_until="domcontentloaded",
                timeout=60000
            )

            page.wait_for_selector(
                "input[placeholder='Enter Username']"
            )

            # -----------------------------
            # Login
            # -----------------------------
            update("Logging into Portal...")

            page.locator(
                "input[placeholder='Enter Username']"
            ).fill(username)

            page.locator(
                "input[placeholder='Enter Password']"
            ).fill(password)

            page.locator(
                "input[placeholder='Enter Email Address']"
            ).fill(email)

            page.locator(
                "input[placeholder='Enter Phone Number']"
            ).fill(phone)

            page.get_by_role(
                "button",
                name="Log In"
            ).click()

            page.wait_for_timeout(3000)

            # If login page is still showing, credentials are likely invalid
            if page.locator("input[placeholder='Enter Username']").count() > 0:

                update("❌ Invalid Username or Password")

                raise Exception("Invalid Username or Password")

            update("Login Successful")

            # -----------------------------
            # Results Page
            # -----------------------------
            update("Opening Results Page...")

            page.get_by_text("Results").click()

            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(5000)

            update("Results Page Loaded")

            # -----------------------------
            # Save HTML
            # -----------------------------
            html = page.content()

            with open(
                "results.html",
                "w",
                encoding="utf-8"
            ) as file:
                file.write(html)

            update("results.html saved successfully")

        except TimeoutError:
            raise Exception("Portal timed out while loading.")

        except Exception as e:
            raise Exception(f"Portal Import Failed: {str(e)}")

        finally:
            browser.close()

    # -----------------------------
    # Parse Semester Tables
    # -----------------------------
    update("Scanning Semester Tables...")

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    semester_tables = ""

    for table in soup.find_all("table"):

        text = table.get_text(" ", strip=True)

        if "Semester" in text:
            semester_tables += "\n\n" + str(table)

    if not semester_tables:
        raise Exception("No semester tables were found.")

    update("Import Completed Successfully")

    return semester_tables