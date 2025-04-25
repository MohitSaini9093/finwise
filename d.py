import csv
import random
from datetime import datetime, timedelta

# Define categories and purchases
categories = {
    "Food": ["Groceries", "Restaurant", "Snacks", "Coffee"],
    "Housing": ["Rent", "Electricity Bill", "Water Bill", "Internet"],
    "Entertainment": ["Movie tickets", "Concert", "Games", "Streaming Subscription"],
    "Transport": ["Bus Ticket", "Fuel", "Uber", "Train Ticket"],
    "Shopping": ["Clothes", "Gadgets", "Books", "Furniture"],
    "Health": ["Gym Membership", "Doctor Visit", "Medicine", "Insurance"]
}

# Generate random dates from September 2024 to January 2025
start_date = datetime(2024, 9, 1)
end_date = datetime(2025, 1, 31)
date_range = (end_date - start_date).days

data = []

for _ in range(100):
    category = random.choice(list(categories.keys()))
    purchase = random.choice(categories[category])
    date = start_date + timedelta(days=random.randint(0, date_range))
    data.append([purchase, category, date.strftime("%d-%m-%Y")])

# Write to CSV file
with open("expenses.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Purchase", "Category", "Date"])
    writer.writerows(data)

print("CSV file 'expenses.csv' generated successfully!")
