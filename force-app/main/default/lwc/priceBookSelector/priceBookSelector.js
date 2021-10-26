import { LightningElement, wire, api } from 'lwc';
import getPriceBooks from '@salesforce/apex/cpqApex.getPriceBooks';
export default class PriceBookSelector extends LightningElement {
    openModal = false; 
    value; 

    @api
    openMe(){
        this.openModal = true; 
    }

    closeModal(){
        this.openModal = false; 
    }
    @wire(getPriceBooks)
        priceBookList;

    get bookOptions(){
        return this.priceBookList.data;
    }

    //get book
    selectBook(e){
        this.value = e.detail.value;
        
    }
    submitBook(){
        const selectedBook = new CustomEvent('newpb',{detail: this.value})
        this.dispatchEvent(selectedBook); 
        this.openModal = false; 
    }
}