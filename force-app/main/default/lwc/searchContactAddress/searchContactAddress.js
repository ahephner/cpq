import { api,track } from 'lwc';
import LightningModal from 'lightning/modal';
const SEARCH_DELAY = 200; 
export default class SearchContactAddress extends LightningModal {
 @track addressList = []
 @track searchList
    @api 
    get content(){
        return this.addressList;
    } 

    set content(data){
        this.addressList = [...data]
        this.showData(); 
    }
    showData(){
        this.searchList = [...this.addressList]
    }

    handleKeyUp(event){
        let search =  event.target.value.toLowerCase();
        if(search.length===0){
            this.searchList = [...this.addressList]
        }
        if(search.length<2){
            return
        }
        if(this.searchTimeOut){
            clearTimeout(this.searchTimeOut);
        }

        this.searchTimeOut = setTimeout(()=>{
            this.searchList = [...this.addressList]

            let narrowed = this.searchList.filter(item => { 
                return item.label.toLowerCase().includes(search); 
             });
             
         this.searchList = [...narrowed]

            
        }, SEARCH_DELAY); 

        
    }

    addThisAddress(event){
        let addId = event.target.dataset.id;
        this.close(addId)
    }

    handleCancel(){
        this.close('Cancel')
    }
}