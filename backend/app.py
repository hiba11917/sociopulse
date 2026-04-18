from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error, IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_FILE_PATH = os.environ.get(
    "EXCEL_FILE_PATH",
    os.path.join(BASE_DIR, "data", "Social Media Wellness Application   (Responses).xlsx")
)


# -----------------------------
# Utility helpers
# -----------------------------
def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "11917"),
        database=os.environ.get("DB_NAME", "sociopulse"),
        port=int(os.environ.get("DB_PORT", "3306")),
        ssl_disabled=True,
        connection_timeout=3,
        autocommit=False
    )


def get_table_columns(table_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f"SHOW COLUMNS FROM {table_name}")
        return [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


def load_excel_data():
    if not os.path.exists(EXCEL_FILE_PATH):
        return pd.DataFrame()

    df = pd.read_excel(EXCEL_FILE_PATH)
    df.columns = [str(col).strip() for col in df.columns]

    column_map = {
        "4. Average daily social media usage": "daily_usage",
        "6. I check social media right before going to bed.": "before_bed",
        "12. I often see negative news on social media.": "negative_news",
        "14. I see a lot of argumentative or stressful content.": "stressful_content",
        "16. I see content that makes me feel excluded or left out socially.": "excluded_content",
        "17. I feel anxious after using social media.": "anxious_after_use",
        "19. I feel drained or tired after long social media sessions.": "tired_after_use",
        "20. My mood worsens on days when I spend more time on social media.": "mood_worsens",
        "22. Social media affects my sleep quality.": "sleep_affected",
        "27. Have you experienced any adverse interactions on social media?": "adverse_interaction",
        "25. Wellbeing score": "wellbeing_numeric"
    }

    available = {k: v for k, v in column_map.items() if k in df.columns}
    if not available:
        return pd.DataFrame()

    df = df[list(available.keys())].rename(columns=available)
    return df


def load_mysql_assessment_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT daily_usage, before_bed, negative_news, stressful_content,
                   excluded_content, anxious_after_use, tired_after_use,
                   mood_worsens, sleep_affected, adverse_interaction,
                   wellbeing_result
            FROM assessments
        """)
        rows = cursor.fetchall()

        if not rows:
            return pd.DataFrame()

        df = pd.DataFrame(rows)
        wellbeing_map = {"Good": 4, "Moderate": 3, "Poor": 1}
        df["wellbeing_numeric"] = df["wellbeing_result"].map(wellbeing_map)
        return df
    finally:
        cursor.close()
        conn.close()


def combine_community_data():
    excel_df = load_excel_data()
    mysql_df = load_mysql_assessment_data()

    if excel_df.empty and mysql_df.empty:
        return pd.DataFrame()
    if excel_df.empty:
        return mysql_df
    if mysql_df.empty:
        return excel_df

    common_cols = list(set(excel_df.columns).intersection(set(mysql_df.columns)))
    excel_df = excel_df[common_cols]
    mysql_df = mysql_df[common_cols]

    return pd.concat([excel_df, mysql_df], ignore_index=True)


def generate_community_insights():
    df = combine_community_data()
    insights = []

    if df.empty:
        return ["No community data available yet."]

    numeric_cols = [
        "before_bed",
        "negative_news",
        "stressful_content",
        "excluded_content",
        "anxious_after_use",
        "tired_after_use",
        "mood_worsens",
        "sleep_affected",
        "wellbeing_numeric"
    ]

    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "before_bed" in df.columns and "sleep_affected" in df.columns:
        group = df[df["before_bed"] >= 4]
        if len(group) >= 5:
            pct = round((len(group[group["sleep_affected"] >= 4]) / len(group)) * 100)
            insights.append(f"{pct}% of users who use social media before bed report poor sleep.")
        elif len(group) > 0:
            insights.append("Users who frequently use social media before bed often report poorer sleep.")

    if "daily_usage" in df.columns and "wellbeing_numeric" in df.columns:
        group = df[df["daily_usage"].isin(["4–6 hours", "More than 6 hours"])]
        if len(group) >= 5:
            pct = round((len(group[group["wellbeing_numeric"] <= 3]) / len(group)) * 100)
            insights.append(f"{pct}% of high-usage users report lower wellbeing.")
        elif len(group) > 0:
            insights.append("Higher daily social media usage is often associated with lower wellbeing.")

    if "stressful_content" in df.columns and "anxious_after_use" in df.columns:
        group = df[df["stressful_content"] >= 4]
        if len(group) >= 5:
            pct = round((len(group[group["anxious_after_use"] >= 4]) / len(group)) * 100)
            insights.append(f"{pct}% of users exposed to stressful content report higher anxiety after use.")
        elif len(group) > 0:
            insights.append("Stressful content is often linked to higher anxiety after social media use.")

    if "excluded_content" in df.columns and "mood_worsens" in df.columns:
        group = df[df["excluded_content"] >= 4]
        if len(group) >= 5:
            pct = round((len(group[group["mood_worsens"] >= 4]) / len(group)) * 100)
            insights.append(f"{pct}% of users who feel excluded online report worsening mood on high-usage days.")
        elif len(group) > 0:
            insights.append("Feeling excluded online is often linked to worsening mood on high-usage days.")

    if "negative_news" in df.columns and "anxious_after_use" in df.columns:
        group = df[df["negative_news"] >= 4]
        if len(group) >= 5:
            pct = round((len(group[group["anxious_after_use"] >= 4]) / len(group)) * 100)
            insights.append(f"{pct}% of users who frequently see negative news report higher anxiety after use.")
        elif len(group) > 0:
            insights.append("Frequent exposure to negative news is often associated with higher anxiety.")

    if "adverse_interaction" in df.columns:
        total = len(df)
        adverse = df[df["adverse_interaction"].astype(str).str.strip().str.lower() == "yes"]

        if len(adverse) >= 5:
            pct = round((len(adverse) / total) * 100)
            insights.append(f"{pct}% of users experience adverse social media interactions.")
        elif len(adverse) > 0:
            insights.append("A noticeable number of users report adverse social media interactions.")

    if not insights:
        insights.append("Community insights will appear once more user data is available.")

    return insights


def calculate_daily_wellbeing(mood, sleep_quality, before_bed, anxiety_level=None, overwhelm_level=None):
    strain_score = 0

    mood = int(mood)
    sleep_quality = int(sleep_quality)
    before_bed = str(before_bed).strip().lower()

    if mood <= 2:
        strain_score += 3
    elif mood == 3:
        strain_score += 1

    if sleep_quality <= 2:
        strain_score += 3
    elif sleep_quality == 3:
        strain_score += 1

    if before_bed == "yes":
        strain_score += 1

    if anxiety_level is not None and str(anxiety_level) != "":
        anxiety_level = int(anxiety_level)
        if anxiety_level >= 4:
            strain_score += 2
        elif anxiety_level == 3:
            strain_score += 1

    if overwhelm_level is not None and str(overwhelm_level) != "":
        overwhelm_level = int(overwhelm_level)
        if overwhelm_level >= 4:
            strain_score += 2
        elif overwhelm_level == 3:
            strain_score += 1

    if strain_score >= 6:
        return "Poor"
    if strain_score >= 3:
        return "Moderate"
    return "Good"


# -----------------------------
# Auth routes
# -----------------------------
@app.route("/signup", methods=["POST"])
def signup():
    conn = get_db_connection()
    data = request.json
    cursor = conn.cursor(dictionary=True)

    try:
        if not data.get("agreedToPrivacy"):
            return jsonify({"error": "You must agree to the Privacy Policy before signing up."}), 400

        hashed_password = generate_password_hash(data["password"])

        cursor.execute("""
            INSERT INTO users (full_name, email, password, dob, gender, occupation)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data["fullName"],
            data["email"],
            hashed_password,
            data["dob"],
            data["gender"],
            data["occupation"],
        ))

        conn.commit()
        user_id = cursor.lastrowid

        return jsonify({
            "message": "Signup successful",
            "user_id": user_id,
            "full_name": data["fullName"]
        }), 201

    except IntegrityError:
        conn.rollback()
        return jsonify({"error": "An account with this email already exists."}), 409
    except Error as e:
        conn.rollback()
        return jsonify({"error": f"MySQL error: {str(e)}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/login", methods=["POST"])
def login():
    conn = get_db_connection()
    data = request.json
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (data["email"],))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not check_password_hash(user["password"], data["password"]):
            return jsonify({"error": "Invalid password"}), 401

        return jsonify({
            "user_id": user["user_id"],
            "full_name": user["full_name"]
        }), 200
    finally:
        cursor.close()
        conn.close()


# -----------------------------
# Initial assessment routes
# -----------------------------
@app.route("/assessment", methods=["POST"])
def assessment():
    conn = get_db_connection()
    data = request.json
    cursor = conn.cursor()

    try:
        score = 0

        if data["daily_usage"] == "4–6 hours":
            score += 2
        elif data["daily_usage"] == "More than 6 hours":
            score += 3

        if int(data["before_bed"]) >= 4:
            score += 2

        if data["adverse_interaction"] == "Yes":
            score += 2

        if score >= 9:
            result = "Poor"
        elif score >= 5:
            result = "Moderate"
        else:
            result = "Good"

        cursor.execute("""
            INSERT INTO assessments (
                user_id, daily_usage, before_bed, negative_news,
                stressful_content, excluded_content, anxious_after_use,
                tired_after_use, mood_worsens, sleep_affected,
                adverse_interaction, wellbeing_result
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            data["user_id"], data["daily_usage"], data["before_bed"],
            data["negative_news"], data["stressful_content"],
            data["excluded_content"], data["anxious_after_use"],
            data["tired_after_use"], data["mood_worsens"],
            data["sleep_affected"], data["adverse_interaction"], result
        ))

        conn.commit()
        return jsonify({"wellbeing_result": result}), 201
    finally:
        cursor.close()
        conn.close()


@app.route("/latest-assessment/<int:user_id>", methods=["GET"])
def latest_assessment(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT *
            FROM assessments
            WHERE user_id = %s
            ORDER BY created_at DESC, assessment_id DESC
            LIMIT 1
        """, (user_id,))

        assessment = cursor.fetchone()

        if not assessment:
            return jsonify({"error": "No assessment found for this user."}), 404

        return jsonify(assessment), 200

    except Error as e:
        return jsonify({"error": f"MySQL error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/dashboard/<int:user_id>", methods=["GET"])
def dashboard(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT u.full_name, a.*
            FROM users u
            JOIN assessments a ON u.user_id = a.user_id
            WHERE u.user_id = %s
            ORDER BY a.created_at DESC
            LIMIT 1
        """, (user_id,))

        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "No dashboard data found"}), 404

        return jsonify(result), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/community-insights", methods=["GET"])
def community_insights():
    return jsonify({"insights": generate_community_insights()}), 200


# -----------------------------
# Daily check-in routes
# -----------------------------
@app.route("/daily-checkin", methods=["POST"])
def daily_checkin():
    conn = get_db_connection()
    data = request.json
    cursor = conn.cursor()
    duplicate_cursor = conn.cursor(dictionary=True)

    try:
        required_fields = [
            "user_id",
            "checkin_date",
            "screen_time",
            "mood",
            "before_bed",
            "sleep_quality"
        ]

        for field in required_fields:
            if field not in data or data[field] in [None, ""]:
                return jsonify({"error": f"Missing field: {field}"}), 400

        user_id = int(data["user_id"])
        checkin_date = str(data["checkin_date"])
        screen_time = str(data["screen_time"])
        mood = int(data["mood"])
        before_bed = str(data["before_bed"]).strip()
        sleep_quality = int(data["sleep_quality"])
        anxiety_level = data.get("anxiety_level")
        overwhelm_level = data.get("overwhelm_level")

        duplicate_cursor.execute("""
            SELECT checkin_id
            FROM daily_checkins
            WHERE user_id = %s AND checkin_date = %s
            LIMIT 1
        """, (user_id, checkin_date))
        existing = duplicate_cursor.fetchone()

        if existing:
            return jsonify({"error": "A check-in already exists for this date."}), 409

        daily_checkin_columns = get_table_columns("daily_checkins")

        computed_daily_result = calculate_daily_wellbeing(
            mood=mood,
            sleep_quality=sleep_quality,
            before_bed=before_bed,
            anxiety_level=anxiety_level,
            overwhelm_level=overwhelm_level,
        )

        insert_payload = {
            "user_id": user_id,
            "checkin_date": checkin_date,
            "screen_time": screen_time,
            "mood": mood,
            "before_bed": before_bed,
            "sleep_quality": sleep_quality,
        }

        if "anxiety_level" in daily_checkin_columns and anxiety_level not in [None, ""]:
            insert_payload["anxiety_level"] = int(anxiety_level)

        if "overwhelm_level" in daily_checkin_columns and overwhelm_level not in [None, ""]:
            insert_payload["overwhelm_level"] = int(overwhelm_level)

        if "daily_wellbeing_result" in daily_checkin_columns:
            insert_payload["daily_wellbeing_result"] = computed_daily_result

        columns = list(insert_payload.keys())
        placeholders = ", ".join(["%s"] * len(columns))
        column_string = ", ".join(columns)
        values = [insert_payload[column] for column in columns]

        cursor.execute(
            f"INSERT INTO daily_checkins ({column_string}) VALUES ({placeholders})",
            values,
        )

        conn.commit()

        return jsonify({
            "message": "Check-in saved",
            "daily_wellbeing_result": computed_daily_result
        }), 201

    except ValueError as e:
        conn.rollback()
        return jsonify({"error": f"Invalid data type: {str(e)}"}), 400
    except Error as e:
        conn.rollback()
        return jsonify({"error": f"MySQL error: {str(e)}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    finally:
        cursor.close()
        duplicate_cursor.close()
        conn.close()


@app.route("/daily-checkins/<int:user_id>", methods=["GET"])
def get_checkins(user_id):
    conn = get_db_connection()
    columns = get_table_columns("daily_checkins")

    base_fields = ["checkin_date", "screen_time", "mood", "before_bed", "sleep_quality"]
    optional_fields = [
        field for field in ["anxiety_level", "overwhelm_level", "daily_wellbeing_result"]
        if field in columns
    ]
    select_fields = base_fields + optional_fields

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(f"""
            SELECT {", ".join(select_fields)}
            FROM daily_checkins
            WHERE user_id = %s
            ORDER BY checkin_date ASC
        """, (user_id,))

        rows = cursor.fetchall()

        for row in rows:
            row["daily_wellbeing_result"] = calculate_daily_wellbeing(
                mood=row["mood"],
                sleep_quality=row["sleep_quality"],
                before_bed=row["before_bed"],
                anxiety_level=row.get("anxiety_level"),
                overwhelm_level=row.get("overwhelm_level"),
            )

        return jsonify(rows), 200
    finally:
        cursor.close()
        conn.close()


# -----------------------------
# Completed goals routes
# -----------------------------
@app.route("/completed-goals/<int:user_id>", methods=["GET"])
def get_completed_goals(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT completed_goal_id, goal_id, goal_title, goal_category, completed_at
            FROM completed_goals
            WHERE user_id = %s
            ORDER BY completed_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        return jsonify(rows), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/completed-goals", methods=["POST"])
def add_completed_goal():
    conn = get_db_connection()
    data = request.json
    cursor = conn.cursor()

    try:
        required_fields = ["user_id", "goal_id", "goal_title", "goal_category"]

        for field in required_fields:
            if field not in data or str(data[field]).strip() == "":
                return jsonify({"error": f"Missing field: {field}"}), 400

        cursor.execute("""
            INSERT INTO completed_goals (user_id, goal_id, goal_title, goal_category)
            VALUES (%s, %s, %s, %s)
        """, (
            data["user_id"],
            data["goal_id"],
            data["goal_title"],
            data["goal_category"]
        ))

        conn.commit()
        return jsonify({"message": "Goal marked as completed"}), 201

    except IntegrityError:
        conn.rollback()
        return jsonify({"error": "Goal already completed"}), 409
    except Error as e:
        conn.rollback()
        return jsonify({"error": f"MySQL error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/completed-goals/<int:user_id>/<goal_id>", methods=["DELETE"])
def remove_completed_goal(user_id, goal_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM completed_goals
            WHERE user_id = %s AND goal_id = %s
        """, (user_id, goal_id))

        conn.commit()
        return jsonify({"message": "Goal unmarked successfully"}), 200
    except Error as e:
        conn.rollback()
        return jsonify({"error": f"MySQL error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# -----------------------------
# Profile routes
# -----------------------------
@app.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT user_id, full_name, email, dob, gender, occupation
            FROM users
            WHERE user_id = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/profile/<int:user_id>", methods=["DELETE"])
def delete_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT user_id
            FROM users
            WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        cursor.execute("DELETE FROM completed_goals WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM daily_checkins WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM assessments WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))

        conn.commit()
        return jsonify({"message": "Account and associated data deleted successfully."}), 200

    except Error as e:
        conn.rollback()
        return jsonify({"error": f"MySQL error: {str(e)}"}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
