import os
import sys
import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.sql_connect import engine

def init_db():
    print("Initializing SQL Schema...")
    with engine.connect() as conn:
        # Create Tables
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                full_name VARCHAR(100),
                phone_number VARCHAR(20),
                role VARCHAR(20),
                current_district VARCHAR(50),
                current_city VARCHAR(50),
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                trust_score INTEGER,
                cert_tier VARCHAR(20),
                skill_tokens INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS merchants (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                shop_name VARCHAR(100),
                business_type VARCHAR(50),
                shop_address_line TEXT,
                shop_city VARCHAR(50),
                shop_district VARCHAR(50),
                shop_latitude DOUBLE PRECISION,
                shop_longitude DOUBLE PRECISION,
                is_verified BOOLEAN DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS user_skills (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                skill_type VARCHAR(50),
                proficiency_level VARCHAR(20),
                is_primary_skill BOOLEAN DEFAULT FALSE,
                years_of_experience INTEGER,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS employment_records (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                job_title VARCHAR(100),
                client_rating DECIMAL(3,2),
                start_date DATE,
                end_date DATE
            );

            CREATE TABLE IF NOT EXISTS merchant_workforce (
                id SERIAL PRIMARY KEY,
                merchant_id VARCHAR(50) REFERENCES merchants(id),
                user_id VARCHAR(50) REFERENCES users(id),
                employment_record_id INTEGER REFERENCES employment_records(id),
                role_at_shop VARCHAR(50),
                hired_date DATE,
                status VARCHAR(20) DEFAULT 'active'
            );

            CREATE TABLE IF NOT EXISTS certificates (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                skill_type VARCHAR(50),
                tier VARCHAR(20),
                cert_trust_weight DECIMAL(3,2),
                verified_media_count INTEGER DEFAULT 0,
                badges_earned_count INTEGER DEFAULT 0,
                verify_url TEXT,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS skill_badges (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                badge_name VARCHAR(100),
                is_valid BOOLEAN DEFAULT TRUE,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS merchant_images (
                id SERIAL PRIMARY KEY,
                merchant_id VARCHAR(50) REFERENCES merchants(id),
                image_url TEXT,
                is_primary BOOLEAN DEFAULT FALSE
            );
        """))
        conn.commit()
    print("Schema initialized.")

def seed_mysuru():
    print("Seeding Mysuru fake data...")
    
    # Coordinates for Mysuru
    MYSURU_LAT = 12.2958
    MYSURU_LNG = 76.6394

    def jitter(base, amount=0.02):
        return base + random.uniform(-amount, amount)

    with engine.connect() as conn:
        # Clear data
        conn.execute(text("TRUNCATE merchant_images, skill_badges, certificates, merchant_workforce, employment_records, user_skills, merchants, users CASCADE;"))
        
        # 1. Create Users
        skills = ["Carpenter", "Weaver", "Potter", "Blacksmith", "Tailor", "Mason"]
        users = []
        for i in range(50):
            uid = f"u_{i:03}"
            role = "merchant" if i < 10 else "user"
            u = {
                "id": uid,
                "full_name": f"Artisan {i}",
                "phone_number": f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
                "role": role,
                "current_district": "Mysuru",
                "current_city": "Mysuru",
                "latitude": jitter(MYSURU_LAT),
                "longitude": jitter(MYSURU_LNG),
                "trust_score": random.randint(40, 95),
                "cert_tier": random.choice(["bronze", "silver", "gold", "master"]),
                "skill_tokens": random.randint(0, 50)
            }
            conn.execute(text("INSERT INTO users (id, full_name, phone_number, role, current_district, current_city, latitude, longitude, trust_score, cert_tier, skill_tokens) VALUES (:id, :full_name, :phone_number, :role, :current_district, :current_city, :latitude, :longitude, :trust_score, :cert_tier, :skill_tokens)"), u)
            users.append(u)
        
        # 2. Create Merchants
        merchants = []
        for i in range(10):
            mid = f"m_{i:03}"
            u = users[i]
            m = {
                "id": mid,
                "user_id": u["id"],
                "shop_name": f"{u['full_name']}'s {random.choice(['Crafts', 'Workshop', 'Handicrafts', 'Solutions'])}",
                "business_type": random.choice(["Manufacturing", "Retail", "Services"]),
                "shop_address_line": f"Street {i}, Mysuru Industrial Area",
                "shop_city": "Mysuru",
                "shop_district": "Mysuru",
                "shop_latitude": jitter(MYSURU_LAT, 0.01),
                "shop_longitude": jitter(MYSURU_LNG, 0.01),
                "is_verified": True
            }
            conn.execute(text("INSERT INTO merchants (id, user_id, shop_name, business_type, shop_address_line, shop_city, shop_district, shop_latitude, shop_longitude, is_verified) VALUES (:id, :user_id, :shop_name, :business_type, :shop_address_line, :shop_city, :shop_district, :shop_latitude, :shop_longitude, :is_verified)"), m)
            merchants.append(m)
            
            # Add merchant image
            conn.execute(text("INSERT INTO merchant_images (merchant_id, image_url, is_primary) VALUES (:mid, :url, TRUE)"), {"mid": mid, "url": f"https://picsum.photos/seed/{mid}/400/300"})

        # 3. Create Skills & Certificates
        for u in users:
            skill = random.choice(skills)
            conn.execute(text("INSERT INTO user_skills (user_id, skill_type, proficiency_level, is_primary_skill, years_of_experience) VALUES (:uid, :skill, :level, TRUE, :exp)"), 
                         {"uid": u["id"], "skill": skill, "level": random.choice(["Intermediate", "Expert", "Advanced"]), "exp": random.randint(2, 20)})
            
            conn.execute(text("INSERT INTO certificates (user_id, skill_type, tier, cert_trust_weight, verified_media_count, badges_earned_count, verify_url) VALUES (:uid, :skill, :tier, :weight, :media, :badges, :url)"),
                         {"uid": u["id"], "skill": skill, "tier": u["cert_tier"], "weight": random.uniform(0.5, 1.0), "media": random.randint(1, 10), "badges": random.randint(1, 5), "url": f"https://gramsphere.ai/verify/{u['id']}"})
            
            # Add some badges
            for _ in range(random.randint(0, 3)):
                conn.execute(text("INSERT INTO skill_badges (user_id, badge_name, is_valid) VALUES (:uid, :badge, TRUE)"), {"uid": u["id"], "badge": f"Top {skill}"})

        # 4. Create Workforce & Records (Employed Users)
        worker_users = users[10:]
        for i in range(25): # Employ 25 users
            u = worker_users[i]
            m = random.choice(merchants)
            
            # Create record
            res = conn.execute(text("INSERT INTO employment_records (user_id, job_title, client_rating, start_date) VALUES (:uid, :title, :rating, :start) RETURNING id"),
                               {"uid": u["id"], "title": f"Senior {random.choice(skills)}", "rating": random.uniform(4.0, 5.0), "start": datetime.now() - timedelta(days=random.randint(100, 1000))})
            record_id = res.fetchone()[0]
            
            conn.execute(text("INSERT INTO merchant_workforce (merchant_id, user_id, employment_record_id, role_at_shop, hired_date, status) VALUES (:mid, :uid, :rid, :role, :hired, 'active')"),
                         {"mid": m["id"], "uid": u["id"], "rid": record_id, "role": "Employee", "hired": datetime.now() - timedelta(days=random.randint(30, 500))})

        conn.commit()
    print("Mysuru data seeded successfully.")

if __name__ == "__main__":
    init_db()
    seed_mysuru()
