from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import tempfile
import os
import re

app = Flask(__name__, static_folder='../', static_url_path='')
CORS(app)

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('../', 'index.html')

@app.route('/pages/<path:path>')
def serve_pages(path):
    return send_from_directory('../pages', path)

@app.route('/styles/<path:path>')
def serve_styles(path):
    return send_from_directory('../styles', path)

@app.route('/scripts/<path:path>')
def serve_scripts(path):
    return send_from_directory('../scripts', path)

# Python execution endpoint
@app.route('/run-python', methods=['POST'])
def run_python():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input_data', '')
        
        if not code:
            return jsonify({'error': 'No code provided'}), 400
        
        # Создаем временный файл для кода
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Выполняем код с передачей входных данных
            process = subprocess.Popen(
                ['python3', temp_file],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Передаем входные данные в процесс
            stdout, stderr = process.communicate(input=input_data, timeout=10)
            
            output = stdout
            error = stderr
            
            # Очищаем ANSI escape codes
            ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
            output = ansi_escape.sub('', output)
            error = ansi_escape.sub('', error)
            
            return jsonify({
                'output': output,
                'error': error,
                'return_code': process.returncode
            })
            
        except subprocess.TimeoutExpired:
            return jsonify({'error': 'Execution timeout'}), 408
        except Exception as e:
            return jsonify({'error': f'Execution error: {str(e)}'}), 500
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# C++ execution endpoint
@app.route('/run-cpp', methods=['POST'])
def run_cpp():
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input_data', '')
        
        if not code:
            return jsonify({'error': 'No code provided'}), 400
        
        # Создаем временные файлы
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as source_file:
            source_file.write(code)
            source_path = source_file.name
        
        with tempfile.NamedTemporaryFile(delete=False) as exec_file:
            exec_path = exec_file.name
        
        try:
            # Компилируем C++ код
            compile_result = subprocess.run(
                ['g++', source_path, '-o', exec_path, '-std=c++11'],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if compile_result.returncode != 0:
                error_output = compile_result.stderr
                error_output = error_output.replace(source_path, 'program.cpp')
                return jsonify({
                    'output': '',
                    'error': f'Ошибка компиляции:\n{error_output}',
                    'return_code': compile_result.returncode
                })
            
            # Запускаем скомпилированную программу
            process = subprocess.Popen(
                [exec_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Передаем входные данные в процесс
            stdout, stderr = process.communicate(input=input_data, timeout=10)
            
            output = stdout
            error = stderr
            
            # Очищаем ANSI escape codes
            ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
            output = ansi_escape.sub('', output)
            error = ansi_escape.sub('', error)
            
            return jsonify({
                'output': output,
                'error': error,
                'return_code': process.returncode
            })
            
        except subprocess.TimeoutExpired:
            return jsonify({'error': 'Execution timeout'}), 408
        except Exception as e:
            return jsonify({'error': f'Execution error: {str(e)}'}), 500
        finally:
            # Удаляем временные файлы
            for file_path in [source_path, exec_path]:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'ok'})

# Проверка доступности компиляторов
@app.route('/check-compilers')
def check_compilers():
    compilers = {}
    
    # Проверяем Python
    try:
        python_result = subprocess.run(['python3', '--version'], capture_output=True, text=True)
        compilers['python'] = python_result.stdout.strip() if python_result.returncode == 0 else 'Not available'
    except:
        compilers['python'] = 'Not available'
    
    # Проверяем g++
    try:
        gpp_result = subprocess.run(['g++', '--version'], capture_output=True, text=True)
        if gpp_result.returncode == 0:
            gpp_version = gpp_result.stdout.split('\n')[0] if gpp_result.stdout else 'Available'
            compilers['g++'] = gpp_version
        else:
            compilers['g++'] = 'Not available'
    except:
        compilers['g++'] = 'Not available'
    
    return jsonify(compilers)

@app.route('/examples/<language>')
def get_examples(language):
    try:
        # Правильный путь к config.json
        config_path = os.path.join(os.path.dirname(__file__), '..', 'examples', 'config.json')
        config_path = os.path.abspath(config_path)
        
        print(f"Loading config from: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        if language not in config:
            return jsonify({'error': 'Language not found'}), 404
        
        examples_list = []
        for example in config[language]['examples']:
            # Правильный путь к файлам примеров
            file_path = os.path.join(os.path.dirname(__file__), '..', 'examples', example['file'])
            file_path = os.path.abspath(file_path)
            
            print(f"Loading example: {file_path}")
            
            example_data = example.copy()
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    example_data['content'] = f.read()
            except FileNotFoundError:
                print(f"File not found: {file_path}")
                example_data['content'] = f'# Файл примера не найден: {example["file"]}'
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")
                example_data['content'] = f'# Ошибка чтения файла: {str(e)}'
            
            examples_list.append(example_data)
        
        return jsonify(examples_list)
        
    except Exception as e:
        print(f"Error in get_examples: {e}")
        return jsonify({'error': f'Error loading examples: {str(e)}'}), 500

@app.route('/example/<language>/<example_id>')
def get_example(language, example_id):
    try:
        # Правильный путь к config.json
        config_path = os.path.join(os.path.dirname(__file__), '..', 'examples', 'config.json')
        config_path = os.path.abspath(config_path)
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        if language not in config:
            return jsonify({'error': 'Language not found'}), 404
        
        # Находим пример по ID
        example = next((ex for ex in config[language]['examples'] if ex['id'] == example_id), None)
        if not example:
            return jsonify({'error': 'Example not found'}), 404
        
        # Правильный путь к файлу примера
        file_path = os.path.join(os.path.dirname(__file__), '..', 'examples', example['file'])
        file_path = os.path.abspath(file_path)
        
        print(f"Loading example content: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({'content': content})
        except FileNotFoundError:
            print(f"Example file not found: {file_path}")
            return jsonify({'error': 'Example file not found'}), 404
        
    except Exception as e:
        print(f"Error in get_example: {e}")
        return jsonify({'error': f'Error loading example: {str(e)}'}), 500

if __name__ == '__main__':
    print("Запуск сервера на http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True, threaded=True)