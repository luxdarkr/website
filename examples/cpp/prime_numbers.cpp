#include <iostream>
#include <vector>
using namespace std;

vector<int> find_primes(int n) {
    vector<bool> is_prime(n + 1, true);
    vector<int> primes;
    
    is_prime[0] = is_prime[1] = false;
    
    for (int i = 2; i * i <= n; i++) {
        if (is_prime[i]) {
            for (int j = i * i; j <= n; j += i) {
                is_prime[j] = false;
            }
        }
    }
    
    for (int i = 2; i <= n; i++) {
        if (is_prime[i]) {
            primes.push_back(i);
        }
    }
    
    return primes;
}

int main() {
    int n;
    cout << "Введите число N: ";
    cin >> n;
    
    vector<int> primes = find_primes(n);
    
    cout << "Простые числа до " << n << ":" << endl;
    for (int prime : primes) {
        cout << prime << " ";
    }
    cout << endl;
    
    return 0;
}