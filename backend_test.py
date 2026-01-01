import requests
import sys
import json
from datetime import datetime

class FinanceAPITester:
    def __init__(self, base_url="https://fiscal-control-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_category_id = None
        self.created_transaction_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_init_categories(self):
        """Test initializing default categories"""
        return self.run_test("Initialize Categories", "POST", "init-default-categories", 200)

    def test_get_categories(self):
        """Test getting all categories"""
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} categories")
            if len(response) >= 16:
                print("   ✅ All 16 default categories present")
            else:
                print(f"   ⚠️  Expected 16 categories, found {len(response)}")
        return success, response

    def test_create_category(self):
        """Test creating a new category"""
        category_data = {
            "name": "Teste Categoria",
            "due_day": 15,
            "color": "#FF5733",
            "order": 100
        }
        success, response = self.run_test("Create Category", "POST", "categories", 200, category_data)
        if success and 'id' in response:
            self.created_category_id = response['id']
            print(f"   Created category with ID: {self.created_category_id}")
        return success, response

    def test_update_category(self):
        """Test updating a category"""
        if not self.created_category_id:
            print("❌ No category ID available for update test")
            return False, {}
        
        update_data = {
            "name": "Categoria Atualizada",
            "due_day": 20,
            "color": "#33FF57",
            "order": 101
        }
        return self.run_test("Update Category", "PUT", f"categories/{self.created_category_id}", 200, update_data)

    def test_create_transaction(self):
        """Test creating a transaction"""
        if not self.created_category_id:
            print("❌ No category ID available for transaction test")
            return False, {}
        
        transaction_data = {
            "category_id": self.created_category_id,
            "month": 1,
            "year": 2026,
            "planned_value": 1000.0,
            "actual_value": 950.0,
            "notes": "Teste de transação"
        }
        success, response = self.run_test("Create Transaction", "POST", "transactions", 200, transaction_data)
        if success and 'id' in response:
            self.created_transaction_id = response['id']
            print(f"   Created transaction with ID: {self.created_transaction_id}")
        return success, response

    def test_get_transactions(self):
        """Test getting transactions"""
        return self.run_test("Get Transactions", "GET", "transactions", 200, params={"year": 2026})

    def test_update_transaction(self):
        """Test updating a transaction"""
        if not self.created_transaction_id:
            print("❌ No transaction ID available for update test")
            return False, {}
        
        update_data = {
            "planned_value": 1100.0,
            "actual_value": 1050.0,
            "notes": "Transação atualizada"
        }
        return self.run_test("Update Transaction", "PUT", f"transactions/{self.created_transaction_id}", 200, update_data)

    def test_get_summary(self):
        """Test getting year summary"""
        success, response = self.run_test("Get Year Summary", "GET", "summary/2026", 200)
        if success:
            expected_keys = ['year', 'total_planned', 'total_actual', 'monthly_summary', 'category_summary']
            missing_keys = [key for key in expected_keys if key not in response]
            if not missing_keys:
                print("   ✅ Summary contains all expected fields")
            else:
                print(f"   ⚠️  Missing fields: {missing_keys}")
        return success, response

    def test_create_budget(self):
        """Test creating a budget"""
        if not self.created_category_id:
            print("❌ No category ID available for budget test")
            return False, {}
        
        budget_data = {
            "year": 2026,
            "category_id": self.created_category_id,
            "monthly_target": 1000.0
        }
        return self.run_test("Create Budget", "POST", "budgets", 200, budget_data)

    def test_get_budgets(self):
        """Test getting budgets"""
        return self.run_test("Get Budgets", "GET", "budgets", 200, params={"year": 2026})

    def test_delete_transaction(self):
        """Test deleting a transaction"""
        if not self.created_transaction_id:
            print("❌ No transaction ID available for delete test")
            return False, {}
        
        return self.run_test("Delete Transaction", "DELETE", f"transactions/{self.created_transaction_id}", 200)

    def test_delete_category(self):
        """Test deleting a category"""
        if not self.created_category_id:
            print("❌ No category ID available for delete test")
            return False, {}
        
        return self.run_test("Delete Category", "DELETE", f"categories/{self.created_category_id}", 200)

def main():
    print("🚀 Starting Finance API Tests...")
    print(f"Testing against: https://fiscal-control-3.preview.emergentagent.com/api")
    
    tester = FinanceAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Initialize Categories", tester.test_init_categories),
        ("Get Categories", tester.test_get_categories),
        ("Create Category", tester.test_create_category),
        ("Update Category", tester.test_update_category),
        ("Create Transaction", tester.test_create_transaction),
        ("Get Transactions", tester.test_get_transactions),
        ("Update Transaction", tester.test_update_transaction),
        ("Get Summary", tester.test_get_summary),
        ("Create Budget", tester.test_create_budget),
        ("Get Budgets", tester.test_get_budgets),
        ("Delete Transaction", tester.test_delete_transaction),
        ("Delete Category", tester.test_delete_category),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            success, _ = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())