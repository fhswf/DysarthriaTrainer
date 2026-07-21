class CustomTrainer:
    def __init__(self, model, dataset, epochs=10, batch_size=32):
        self.model = model
        self.dataset = dataset
        self.epochs = epochs
        self.batch_size = batch_size

    def train(self):
        if not self.model:
            print("No model provided for training.")    
            return
        
        print(f"Training {self.model.get_name()} on {self.dataset.get_name()} for {self.epochs} epochs with batch size {self.batch_size}")
        # Implement the training logic here
        # This could involve loading data, training the model, and saving the results
        self.mode.train(self.dataset, epochs=self.epochs, batch_size=self.batch_size)
