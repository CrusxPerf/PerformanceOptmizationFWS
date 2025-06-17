import unittest
from unittest.mock import patch, MagicMock
import io
from app import app # Assuming app.py is in the same directory or accessible

class BasicTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_no_pdf_file_provided(self):
        response = self.app.post('/parse-pdf-tables', data={})
        self.assertEqual(response.status_code, 400)
        json_data = response.get_json()
        self.assertEqual(json_data['error'], "No PDF file provided.")

    def test_no_selected_file(self):
        # Simulate a file part with an empty filename
        data = {
            'pdf_file': (io.BytesIO(b""), '')
        }
        response = self.app.post('/parse-pdf-tables', content_type='multipart/form-data', data=data)
        self.assertEqual(response.status_code, 400)
        json_data = response.get_json()
        self.assertEqual(json_data['error'], "No selected file.")

    @patch('app.camelot.read_pdf')
    def test_parse_pdf_tables_success_mocked(self, mock_read_pdf):
        # Mock camelot.read_pdf to return a dummy table
        mock_table = MagicMock()
        mock_table.df = MagicMock()
        # Configure the mock to simulate the chain: df.where(...).to_dict(...)
        mock_table.df.where.return_value.to_dict.return_value = [{"col1": "data1", "col2": "data2"}]

        # This will be the iterable returned by read_pdf
        mock_camelot_tables_iterator = [mock_table]

        # To allow len(tables) to work, we can wrap the iterator in a list-like mock
        # or simply return a list directly if Camelot's Tables object behaves like a list.
        # For simplicity, let's assume read_pdf returns a list-like object or a list of tables.
        # If `tables` is an object that is iterable and supports `len()`,
        # we might need a more complex mock. Let's try with a simple list first.
        mock_read_pdf.return_value = mock_camelot_tables_iterator

        # Create a dummy PDF file in memory
        data = {
            'pdf_file': (io.BytesIO(b"dummy pdf content"), 'test.pdf')
        }
        response = self.app.post('/parse-pdf-tables', content_type='multipart/form-data', data=data)

        self.assertEqual(response.status_code, 200)
        json_data = response.get_json()
        # The message should reflect the number of tables, which is len(mock_camelot_tables_iterator)
        self.assertEqual(json_data['message'], f"Extracted {len(mock_camelot_tables_iterator)} tables.")
        self.assertIn('data', json_data)
        self.assertEqual(len(json_data['data']), len(mock_camelot_tables_iterator))
        self.assertEqual(json_data['data'][0], [{"col1": "data1", "col2": "data2"}])

        # Check that read_pdf was called (filepath will be a temp path)
        mock_read_pdf.assert_called_once()
        args, kwargs = mock_read_pdf.call_args
        self.assertEqual(kwargs.get('pages'), 'all')
        self.assertEqual(kwargs.get('flavor'), 'stream')

if __name__ == '__main__':
    unittest.main()
