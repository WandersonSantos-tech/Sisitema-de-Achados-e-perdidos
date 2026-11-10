import os
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceNotFoundError


class AzureBlobService:
    def __init__(self):
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

        if not connection_string:
            raise RuntimeError(
                "AZURE_STORAGE_CONNECTION_STRING não configurada."
            )

        self.client = BlobServiceClient.from_connection_string(
            connection_string
        )
        self.container = self.client.get_container_client("imagens")

    def upload(self, blob_name: str, content: bytes, content_type: str):
        from azure.storage.blob import ContentSettings

        self.container.upload_blob(
            name=blob_name,
            data=content,
            overwrite=False,
            content_settings=ContentSettings(
                content_type=content_type
            ),
        )

    def download(self, blob_name: str) -> bytes:
        blob = self.container.get_blob_client(blob_name)
        return blob.download_blob().readall()

    def delete(self, blob_name: str):
        try:
            self.container.delete_blob(blob_name)
        except ResourceNotFoundError:
            pass