    CREATE USER dayaway_user WITH PASSWORD 'dayaway_password';
    CREATE DATABASE dayaway_db OWNER dayaway_user;
    GRANT ALL PRIVILEGES ON DATABASE dayaway_db TO dayaway_user;
